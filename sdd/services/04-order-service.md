# `order-service`

> El orquestador. Cubre HU3 (checkout) completo y es el único servicio que implementa la Saga. Requiere que `discount-service`, `catalog-service` y `coupon-service` ya estén corriendo antes de poder probarse de punta a punta. Ver SDD §02 (HU3), §09 (Saga), §06.

## 1. Responsabilidad (y qué NO hace)

| Hace | No hace |
|---|---|
| Orquesta el checkout: reservar → resolver cupón → calcular → persistir | No calcula descuentos ni valida stock él mismo — delega y compone |
| Dueño de `orders`, `order_items`, `outbox_events` (schema `order`) | No publica directo a un broker — escribe en su propio outbox, un proceso interno lo relee (SDD §09) |
| Es el único servicio con lógica de **compensación** | No compensa nada que no haya reservado él mismo — la compensación es `catalog-service.releaseStock`, invocada por `order-service` |

## 2. Prerrequisitos

- `discount-service`, `catalog-service` y `coupon-service` corriendo (local: `docker compose up discount-service catalog-service coupon-service`).
- Schema `order` migrado.
- Redis disponible (para el `OutboxRelay` → Pub/Sub, aunque el checkout síncrono en sí no depende de Redis para responder al cliente).

## 3. Variables de entorno

```
PORT=3004
DATABASE_URL=postgresql://...@db.supabase.co:5432/postgres?schema=order
DIRECT_URL=postgresql://...@db.supabase.co:5432/postgres?schema=order
REDIS_URL=redis://redis:6379
INTERNAL_SERVICE_TOKEN=<mismo secreto compartido>
CATALOG_SERVICE_URL=http://catalog-service:3002
COUPON_SERVICE_URL=http://coupon-service:3003
DISCOUNT_SERVICE_URL=http://discount-service:3001
JWE_SECRET=<clave simetrica A256GCM para cifrar guestInfo, SDD §08>
```

## 4. Estructura de carpetas

```
services/order-service/
├── prisma/schema.prisma
├── src/
│   ├── orders/
│   │   ├── orders.controller.ts        # POST /checkout (llamado por el gateway)
│   │   ├── orders.service.ts
│   │   └── orders.repository.ts
│   ├── checkout.saga.ts                # el orquestador — ver seccion 6
│   ├── clients/
│   │   ├── catalog.client.ts           # HTTP a catalog-service, con circuit breaker
│   │   ├── coupon.client.ts
│   │   └── discount.client.ts
│   ├── outbox/
│   │   ├── outbox.entity.ts
│   │   └── outbox-relay.ts             # polling -> Redis Pub/Sub
│   ├── guest-info.crypto.ts            # cifrado JWE de guestInfo (SDD §08)
│   └── main.ts
├── test/unit/
│   ├── checkout.saga.spec.ts
│   └── orders.service.spec.ts
├── Dockerfile
└── package.json
```

## 5. Modelo de datos (schema `order`, SDD §06)

```prisma
model Order {
  id                      String   @id @default(uuid())
  userId                  String?  @map("user_id")            // null si fue checkout de invitado
  couponId                String?  @map("coupon_id")
  originalSubtotal        Decimal  @map("original_subtotal")
  categoryDiscountAmount  Decimal  @map("category_discount_amount")
  volumeDiscountAmount    Decimal  @map("volume_discount_amount")
  couponDiscountAmount    Decimal  @map("coupon_discount_amount")
  discountCapped          Boolean  @map("discount_capped")
  finalTotal              Decimal  @map("final_total")
  status                  String
  guestInfoEnc            Bytes?   @map("guest_info_enc")      // JWE, ver SDD §08
  items                   OrderItem[]
  createdAt               DateTime @default(now()) @map("created_at")
  @@map("orders")
}

model OrderItem {
  id                 String  @id @default(uuid())
  orderId            String  @map("order_id")
  order              Order   @relation(fields: [orderId], references: [id])
  productId          String  @map("product_id")
  categorySnapshot   String  @map("category_snapshot")
  unitPriceSnapshot  Decimal @map("unit_price_snapshot")
  quantity           Int
  lineDiscountAmount Decimal @map("line_discount_amount")
  @@map("order_items")
}

model OutboxEvent {
  id            String   @id @default(uuid())
  aggregateType String   @map("aggregate_type")
  aggregateId   String   @map("aggregate_id")
  eventType     String   @map("event_type")
  payload       Json
  status        String   @default("PENDING")
  createdAt     DateTime @default(now()) @map("created_at")
  @@map("outbox_events")
}
```

## 6. La Saga — implementación exacta (SDD §09, Fig. 5)

```ts
async function runCheckoutSaga(dto: CheckoutRequestDto, user?: AuthenticatedUser) {
  // Paso 1 — reservar stock (unico paso con efecto persistente antes del commit)
  const reservation = await catalogClient.reserveStock(dto.items);
  if (!reservation.ok) throw new InsufficientStockException(reservation.productId); // 409, nada mas que deshacer

  try {
    // Paso 2 — resolver cupon (solo lectura)
    const resolvedCoupon = dto.couponCode
      ? await couponClient.resolve(dto.couponCode)
      : undefined;

    // Paso 3 — calcular (puro, sin I/O)
    const breakdown = await discountClient.calculate({ items: dto.items, resolvedCoupon });

    // Paso 4 — persistir, en una transaccion propia
    const order = await ordersRepository.createInTransaction({
      ...breakdown,
      guestInfoEnc: dto.guestInfo ? await encryptGuestInfo(dto.guestInfo, JWE_KEY) : null,
      userId: user?.id ?? null,
    }); // esta misma transaccion inserta la fila en outbox_events

    return order; // 201 al cliente — el OutboxRelay publica async, el cliente no espera
  } catch (err) {
    // Compensacion: el unico caso real de "Saga" en este flujo
    await catalogClient.releaseStock(dto.items);
    throw new OrderPersistenceFailedException(err);
  }
}
```

**No optimices esto fusionando pasos.** Cada llamada es un límite de proceso real (SDD §01 "Esto invalida un supuesto de la primera versión de este SDD") — si `discount-service` está caído, el catch libera el stock correctamente; si lo fusionas, pierdes el punto exacto donde compensar.

## 7. Endpoints

| Método | Ruta | Auth | Notas |
|---|---|---|---|
| `POST` | `/checkout` | Opcional (invitado permitido, SDD §02 HU5) | Corre la Saga completa |
| `GET` | `/:id` | `Customer`/`Admin` | Consulta una orden persistida |
| `PATCH` | `/users/me/profile` | `Customer` | HU5 — guarda dirección de entrega por defecto |

Los clientes HTTP internos (`catalog.client.ts`, etc.) deben envolverse con un circuit breaker (`opossum`) — ver SDD §10: si `catalog-service` está en `OPEN`, `order-service` responde 503 con `Retry-After` sin intentar la llamada.

## 8. Pruebas unitarias — 80% mínimo, con integración mockeada al 85%+ (SDD §12)

- Camino feliz completo: mockear los 3 clientes HTTP, verificar que se persiste exactamente el `breakdown` calculado.
- **Stock insuficiente**: `catalogClient.reserveStock` retorna `ok:false` → la saga nunca llega a `discountClient.calculate`, responde 409, cero llamadas a `discountClient`.
- **Fallo de persistencia tras reserva exitosa**: mockear `ordersRepository.createInTransaction` para que lance → verificar que `catalogClient.releaseStock` se llamó exactamente una vez con los mismos `items`.
- Checkout de invitado sin `guestInfo` completo → 400 antes de tocar cualquier cliente HTTP.
- Checkout de invitado con `guestInfo` completo → verificar que `guest_info_enc` en el objeto persistido es un blob cifrado, no el JSON plano.
- Circuit breaker abierto en cualquiera de los 3 clientes → 503 con `Retry-After`, sin reservar/liberar stock de más.

```ts
coverageThreshold: { global: { statements: 80, branches: 85, functions: 80, lines: 80 } }
```

Comando: `pnpm --filter order-service test:coverage`

## 9. Cómo correrlo localmente

```bash
docker compose up -d catalog-service coupon-service discount-service redis
pnpm --filter order-service prisma migrate dev
pnpm --filter order-service dev      # puerto 3004
```

## 10. Despliegue en GCP

Además del Deployment/Service estándar (mismo patrón que `catalog-service`), este servicio necesita el `OutboxRelay` corriendo — puede ser un proceso dentro del mismo pod (`main.ts` arranca ambos) o un `CronJob`/segundo contenedor si prefieres separarlo operativamente. Para el MVP, un solo proceso es suficiente y más simple de defender.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: order-service, namespace: ecommerce-prod }
spec:
  replicas: 2
  selector: { matchLabels: { app: order-service } }
  template:
    metadata: { labels: { app: order-service } }
    spec:
      serviceAccountName: sa-order-service
      containers:
        - name: order-service
          image: REGION-docker.pkg.dev/PROJECT/repo/order-service:SHA
          ports: [{ containerPort: 3004 }]
          envFrom: [{ secretRef: { name: order-service-secrets } }]   # incluye JWE_SECRET
---
apiVersion: v1
kind: Service
metadata: { name: order-service, namespace: ecommerce-prod }
spec:
  selector: { app: order-service }
  ports: [{ port: 3004, targetPort: 3004 }]
  type: ClusterIP
```

`sa-order-service` es la única service account con acceso al secreto `JWE_SECRET` en Secret Manager — ningún otro servicio lo necesita (SDD §08).

## 11. Definition of Done

- [ ] La compensación (`releaseStock` tras fallo de persistencia) tiene una prueba explícita, no inferida.
- [ ] El ejemplo 2 del SDD §04 (cupón `TECH30`, tope 35% activado) pasa como test de integración end-to-end contra los 3 servicios reales (no mockeados) al menos una vez, en local.
- [ ] Cobertura ≥80% (≥85% en ramas del módulo de la saga).
- [ ] `POST /checkout` nunca responde 201 sin una fila en `outbox_events`.
