# `coupon-service`

> Dueño de `coupons`. Cubre HU2 (validación) y HU7 (catálogo público + CRUD admin). Ver SDD §02 (HU2/HU7), §04 ("Vigencia = dos fechas, no una"), §06.

## 1. Responsabilidad (y qué NO hace)

| Hace | No hace |
|---|---|
| Decide si un código de cupón es válido: existe, `active=true`, y `now` cae dentro de `[valid_from, valid_to]` | No calcula el monto del descuento — eso es `discount-service` |
| Expone el catálogo público de cupones vigentes (HU7) | No expone cupones inactivos o fuera de vigencia bajo ninguna circunstancia (ni en `/available` ni en errores verbosos) |

## 2. Prerrequisitos

- Schema `coupon` migrado en la misma instancia de Supabase que `catalog-service` (schema distinto, sin FK cruzado — `categoryId` es una referencia liviana sin integridad referencial a nivel de base de datos, SDD §02 HU7).

## 3. Variables de entorno

```
PORT=3003
DATABASE_URL=postgresql://...@db.supabase.co:5432/postgres?schema=coupon
DIRECT_URL=postgresql://...@db.supabase.co:5432/postgres?schema=coupon
INTERNAL_SERVICE_TOKEN=<mismo secreto compartido>
```

## 4. Estructura de carpetas

```
services/coupon-service/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── coupons/
│   │   ├── coupons.controller.ts    # publico (/available) + admin
│   │   ├── coupons.service.ts       # resolveCoupon() vive aqui
│   │   └── coupons.repository.ts
│   └── main.ts
├── test/unit/
│   └── coupons.service.spec.ts
├── Dockerfile
└── package.json
```

## 5. Modelo de datos (schema `coupon`, SDD §06)

```prisma
model Coupon {
  id              String    @id @default(uuid())
  code            String    @unique
  label           String
  scope           String    // 'GLOBAL' | 'CATEGORY'
  categoryId      String?   @map("category_id")   // sin FK real a catalog.categories
  categoryName    String?   @map("category_name")  // denormalizado para no llamar a catalog-service en cada resolve
  discountPercent Decimal   @map("discount_percent")
  active          Boolean   @default(true)
  validFrom       DateTime? @map("valid_from")
  validTo         DateTime? @map("valid_to")
  @@map("coupons")
}
```

## 6. Endpoints

| Método | Ruta | Auth | Notas |
|---|---|---|---|
| `GET` | `/available` | Pública | HU7 — solo `active=true` y vigentes, campos limitados (`code, label, scope, categoryName, discountPercent`) |
| `GET` | `/:code` | Pública | HU2 — valida existencia/vigencia de un código puntual |
| `POST` | `/admin/coupons` | `role=ADMIN` | HU7 |
| `PATCH` | `/admin/coupons/:id` | `role=ADMIN` | HU7 — incluye desactivar (`active=false`) |
| `POST` | `/internal/coupons/resolve` | `X-Internal-Token` | Llamado por `order-service` y por `api-gateway` (camino de preview) |

## 7. La función más importante del servicio: `resolveCoupon`

Copiar exactamente del SDD §04 — es donde vive la lógica de vigencia completa:

```ts
function resolveCoupon(code: string, now: Date) {
  const coupon = repository.findByCode(code);
  if (!coupon) return { applied: false, reason: 'INVALID_COUPON' };
  if (!coupon.active) return { applied: false, reason: 'INVALID_COUPON' };
  if (coupon.validFrom && now < coupon.validFrom) return { applied: false, reason: 'NOT_YET_VALID' };
  if (coupon.validTo && now > coupon.validTo) return { applied: false, reason: 'EXPIRED_COUPON' };
  return { scope: coupon.scope, categoryName: coupon.categoryName, discountPercent: coupon.discountPercent };
}
```

**Los cuatro casos de negocio son distintos y no deben colapsarse en uno solo:** no existe, inactivo, aún no vigente, expirado. Ninguno de los cuatro es un error HTTP — todos son un `applied: false` con su `reason` (SDD §12).

## 8. Pasos de implementación

1. Modelo Prisma + migración contra el schema `coupon`.
2. `seed.ts` con **los cuatro casos de prueba obligatorios** (SDD §06/§12):
   - `WELCOME2026` — global, 15%, vigente.
   - `TECH30` / `JUGUETES10` — por categoría, vigentes.
   - `EXPIRED2025` — vigente en el pasado (`valid_to` vencido).
   - `FUTURE2027` — vigente en el futuro (`valid_from` aún no llega) — este es el que faltaba en la primera versión del SDD, no lo omitas.
3. `CouponsRepository.findByCode()`.
4. `CouponsService.resolveCoupon()` tal cual la sección 7.
5. `GET /available`: filtrar en la query misma (`WHERE active = true AND (valid_from IS NULL OR valid_from <= now()) AND (valid_to IS NULL OR valid_to >= now())`), no traer todo y filtrar en memoria.
6. Endpoints admin con el mismo patrón de `RolesGuard` que `catalog-service` (header ya verificado por el gateway).

## 9. Pruebas unitarias — 80% mínimo, con énfasis en los 4 casos

- Cupón inexistente → `INVALID_COUPON`.
- Cupón inactivo → `INVALID_COUPON`.
- Cupón expirado (`now > valid_to`) → `EXPIRED_COUPON`.
- **Cupón aún no vigente (`now < valid_from`) → `NOT_YET_VALID`** — caso que la primera versión del documento no cubría; no lo saltes.
- Cupón válido con `scope: CATEGORY` → devuelve `categoryName` correcto.
- `GET /available` nunca incluye `EXPIRED2025` ni `FUTURE2027` ni un cupón `active=false` en la respuesta.

```ts
coverageThreshold: { global: { statements: 80, branches: 80, functions: 80, lines: 80 } }
```

Comando: `pnpm --filter coupon-service test:coverage`

## 10. Cómo correrlo localmente

```bash
pnpm --filter coupon-service prisma migrate dev
pnpm --filter coupon-service prisma db seed
pnpm --filter coupon-service dev      # puerto 3003
```

## 11. Despliegue en GCP

Mismo patrón que `catalog-service` (Dockerfile multi-stage con `prisma generate`, Deployment + Service `ClusterIP`, secretos vía CSI Secret Store). Variables propias: `catalog-service-secrets` → `coupon-service-secrets`, mismo `INTERNAL_SERVICE_TOKEN` compartido con el resto.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: coupon-service, namespace: ecommerce-prod }
spec:
  replicas: 2
  selector: { matchLabels: { app: coupon-service } }
  template:
    metadata: { labels: { app: coupon-service } }
    spec:
      serviceAccountName: sa-coupon-service
      containers:
        - name: coupon-service
          image: REGION-docker.pkg.dev/PROJECT/repo/coupon-service:SHA
          ports: [{ containerPort: 3003 }]
          envFrom: [{ secretRef: { name: coupon-service-secrets } }]
---
apiVersion: v1
kind: Service
metadata: { name: coupon-service, namespace: ecommerce-prod }
spec:
  selector: { app: coupon-service }
  ports: [{ port: 3003, targetPort: 3003 }]
  type: ClusterIP
```

## 12. Definition of Done

- [ ] Los 4 casos de `resolveCoupon` (inexistente / inactivo / expirado / aún no vigente) tienen un test cada uno, no un solo test genérico de "cupón inválido".
- [ ] `GET /available` nunca filtra sin la doble condición de fecha.
- [ ] Cobertura ≥80%.
