# `catalog-service`

> Dueño de `products` y `categories`. Cubre HU1 (catálogo), HU6 (CRUD admin) y el paso 1 de la saga (reservar/liberar stock). Ver SDD §01, §02 (HU1/HU6), §06, §09.

## 1. Responsabilidad (y qué NO hace)

| Hace | No hace |
|---|---|
| Lista productos, CRUD de productos (solo `ADMIN`), reserva/libera stock atómicamente | No calcula descuentos, no conoce cupones ni órdenes |
| Dueño exclusivo del schema `catalog` en Postgres | No hace `JOIN` contra `orders` ni `coupons` — otro servicio le pide sus datos por HTTP, nunca al revés |

## 2. Prerrequisitos

- Proyecto Supabase creado, con el schema `catalog` migrado (`prisma migrate dev` apuntando a ese schema).
- `discount-service` no es una dependencia en runtime de este servicio — puede construirse en paralelo.

## 3. Variables de entorno

```
PORT=3002
DATABASE_URL=postgresql://...@db.supabase.co:5432/postgres?schema=catalog
DIRECT_URL=postgresql://...@db.supabase.co:5432/postgres?schema=catalog   # para prisma migrate
INTERNAL_SERVICE_TOKEN=<mismo secreto compartido entre servicios>
```

## 4. Estructura de carpetas

```
services/catalog-service/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── products/
│   │   ├── products.controller.ts       # publico + admin
│   │   ├── products.service.ts
│   │   └── products.repository.ts       # unico punto que conoce Prisma
│   ├── stock/
│   │   ├── stock.controller.ts          # interno: reserve/release
│   │   └── stock.service.ts
│   ├── common/roles.guard.ts
│   └── main.ts
├── test/unit/
│   ├── products.service.spec.ts
│   └── stock.service.spec.ts
├── Dockerfile
└── package.json
```

## 5. Modelo de datos (schema `catalog`, SDD §06)

```prisma
model Category {
  id       String    @id @default(uuid())
  name     String    @unique
  products Product[]
  @@map("categories")
}

model Product {
  id         String   @id @default(uuid())
  sku        String   @unique
  name       String
  unitPrice  Decimal  @map("unit_price")
  categoryId String   @map("category_id")
  category   Category @relation(fields: [categoryId], references: [id])
  stock      Int
  active     Boolean  @default(true)
  @@map("products")
}
```

## 6. Endpoints

| Método | Ruta | Auth | Notas |
|---|---|---|---|
| `GET` | `/products` | Pública | HU1 — expuesto por gateway como `/api/v1/products` |
| `POST` | `/admin/products` | `role=ADMIN` (verificado en gateway, reenviado con `X-Internal-Token`) | HU6 |
| `PATCH` | `/admin/products/:id` | `role=ADMIN` | HU6 — no toca `stock` |
| `PATCH` | `/admin/products/:id/stock` | `role=ADMIN` | HU6 — ajuste manual `{ delta }` |
| `DELETE` | `/admin/products/:id` | `role=ADMIN` | HU6 — soft delete (`active=false`) |
| `POST` | `/internal/stock/reserve` | `X-Internal-Token` | Saga paso 1 (SDD §09) |
| `POST` | `/internal/stock/release` | `X-Internal-Token` | Saga — compensación |

## 7. Pasos de implementación

1. `prisma init` con el schema de la sección 5, `prisma migrate dev --name init` contra el schema `catalog`.
2. `seed.ts`: 4 productos Tecnología, 2 Juguetería, 2 Hogar, 2 Libros (SDD §06).
3. `ProductsRepository` — único archivo que importa `PrismaClient`.
4. `ProductsService.list()` para HU1; `create/update/adjustStock/softDelete` para HU6.
5. **`StockService.reserveStock(items)`**, el método más delicado del servicio:
   ```ts
   // dentro de una transacción Prisma, por cada línea:
   const updated = await tx.product.updateMany({
     where: { id: item.productId, stock: { gte: item.quantity } },
     data: { stock: { decrement: item.quantity } },
   });
   if (updated.count === 0) throw new InsufficientStockException(item.productId);
   ```
   Si **cualquier** línea falla, la transacción completa hace rollback — ninguna línea queda parcialmente decrementada.
6. `StockService.releaseStock(items)` — el inverso (`increment`), usado solo como compensación de la saga (SDD §09 Fig. 5).
7. `PATCH /admin/products/:id/stock` usa el mismo patrón atómico `stock + delta >= 0` que `reserveStock`, para no pisar una compra concurrente.
8. `RolesGuard` simplemente lee un header que el gateway ya adjuntó (`X-User-Role`) tras verificar el JWT — este servicio **no** verifica el JWT de Supabase, confía en la red interna (SDD §08 "Autenticación servicio-a-servicio").

## 8. Pruebas unitarias — 80% mínimo

- `reserveStock`: reserva exitosa decrementa todas las líneas; una línea sin stock revierte **todas**, ninguna queda decrementada.
- `reserveStock` con cantidad exactamente igual al stock disponible → éxito (`stock - qty = 0` es válido).
- `adjustStock` con `delta` negativo mayor al stock disponible → rechazado, no deja `stock` negativo.
- `softDelete`: producto con `order_items` históricos sigue siendo consultable por su `id` (nunca DELETE físico).
- Payload corrupto (`quantity: -1`, `productId` no-UUID) → 400 antes de tocar la base de datos.

```ts
coverageThreshold: { global: { statements: 80, branches: 80, functions: 80, lines: 80 } }
```

Comando: `pnpm --filter catalog-service test:coverage`

## 9. Cómo correrlo localmente

```bash
pnpm --filter catalog-service prisma migrate dev
pnpm --filter catalog-service prisma db seed
pnpm --filter catalog-service dev      # puerto 3002
```

## 10. Despliegue en GCP

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
EXPOSE 3002
CMD ["node", "dist/main.js"]
```

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: catalog-service, namespace: ecommerce-prod }
spec:
  replicas: 2
  selector: { matchLabels: { app: catalog-service } }
  template:
    metadata: { labels: { app: catalog-service } }
    spec:
      serviceAccountName: sa-catalog-service        # Workload Identity, SDD §08
      containers:
        - name: catalog-service
          image: REGION-docker.pkg.dev/PROJECT/repo/catalog-service:SHA
          ports: [{ containerPort: 3002 }]
          envFrom:
            - secretRef: { name: catalog-service-secrets }   # DATABASE_URL, INTERNAL_SERVICE_TOKEN
---
apiVersion: v1
kind: Service
metadata: { name: catalog-service, namespace: ecommerce-prod }
spec:
  selector: { app: catalog-service }
  ports: [{ port: 3002, targetPort: 3002 }]
  type: ClusterIP
```

En Secret Manager: `catalog-service-database-url`, montado vía CSI Secret Store (SDD §11) — nunca como variable en el YAML plano.

## 11. Definition of Done

- [ ] `reserveStock`/`releaseStock` probados con transacciones concurrentes simuladas (dos requests que compiten por el mismo stock).
- [ ] Soft delete verificado — nunca hay `DELETE FROM products`.
- [ ] Cobertura ≥80%.
- [ ] Seed corre limpio contra una base vacía (`prisma migrate reset && prisma db seed`).
