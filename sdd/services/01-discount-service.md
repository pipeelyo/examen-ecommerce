# `discount-service`

> Motor de descuentos acumulativos. Sin base de datos, sin estado, sin dependencias de red salientes. **Constrúyelo primero**: todo lo demás lo llama, y sus pruebas no dependen de que nada más exista. Ver SDD §03 "Aislamiento del motor de descuentos" y §04.

## 1. Responsabilidad (y qué NO hace)

| Hace | No hace |
|---|---|
| Recibe un carrito + un cupón ya resuelto, calcula la cascada Categoría → Volumen → Cupón → tope 35% | No consulta stock, no persiste nada, no conoce a Prisma ni a HTTP fuera de su propio controlador |
| Expone `POST /internal/discounts/calculate` | No decide si un cupón existe o está vigente — eso lo hace `coupon-service` (ver `03-coupon-service.md`) |
| Devuelve un `CheckoutBreakdown` plano | No emite eventos, no habla con Redis |

## 2. Prerrequisitos

Ninguno. Es el único servicio que se puede escribir, probar y dejar 100% terminado sin que exista nada más en el monorepo.

## 3. Variables de entorno

```
PORT=3001
NODE_ENV=development
INTERNAL_SERVICE_TOKEN=dev-internal-token
```

`PORT` y `NODE_ENV` son las únicas del alcance de SDD §1 para este micro (no posee estado ni DB). `INTERNAL_SERVICE_TOKEN` entra por SDD §07/§08: el endpoint interno exige `X-Internal-Token`. No necesita `DATABASE_URL`, `REDIS_URL` ni claves de Supabase — si tu `.env.example` para este servicio tiene alguna de esas, es una señal de que se filtró una dependencia que no debería existir (repórtalo como hallazgo en `docs/ia.md`, es del tipo "corrección a la IA").

## 4. Estructura de carpetas

```
apps/backend/services/discount-service/
├── src/
│   ├── strategies/
│   │   ├── discount-strategy.interface.ts
│   │   ├── category-discount.strategy.ts
│   │   ├── volume-discount.strategy.ts
│   │   └── coupon-discount.strategy.ts
│   ├── factories/
│   │   └── discount-strategy.factory.ts
│   ├── apply-absolute-cap.ts
│   ├── money.ts
│   ├── discount-engine.service.ts
│   ├── discount-engine.controller.ts
│   ├── discount-engine.module.ts
│   ├── internal-token.guard.ts
│   ├── health.controller.ts
│   └── main.ts
├── test/
│   └── unit/
│       ├── category-discount.strategy.spec.ts
│       ├── volume-discount.strategy.spec.ts
│       ├── coupon-discount.strategy.spec.ts
│       ├── apply-absolute-cap.spec.ts
│       └── discount-engine.service.spec.ts
├── Dockerfile
├── package.json
├── tsconfig.json
└── jest.config.ts   (o vitest.config.ts si el monorepo usa Vitest)
```

## 5. Endpoint

| Método | Ruta | Auth | Body | Response |
|---|---|---|---|---|
| `GET` | `/health` | ninguna (sondas de K8s) | — | `{ status, service }` |
| `GET` | `/api/docs` | ninguna | — | Swagger UI (SDD §07) |
| `POST` | `/internal/discounts/calculate` | `X-Internal-Token` (ver SDD §07) | `DiscountContext` (ver abajo) | `CheckoutBreakdown` |

## 6. Contratos (copiar tal cual del SDD §04, no reinterpretar)

```ts
export type DiscountName = 'CATEGORY' | 'VOLUME' | 'COUPON';

export interface CartLineState {
  productId: string;
  category: string;
  originalAmount: number;      // centavos
  remainingAmount: number;     // centavos — se reduce en cada paso del pipeline
}

export interface DiscountContext {
  readonly originalSubtotal: number;                 // centavos, NUNCA cambia
  readonly lines: ReadonlyArray<CartLineState>;
  readonly runningSubtotal: number;                   // = suma de remainingAmount
  readonly resolvedCoupon?: {
    scope: 'GLOBAL' | 'CATEGORY';
    categoryName?: string;
    discountPercent: number;
  };
}

export interface DiscountResult {
  readonly name: DiscountName;
  readonly amount: number;
  readonly subtotalAfter: number;
  readonly applied: boolean;
  readonly reason?: 'NOT_APPLICABLE' | 'INVALID_COUPON' | 'EXPIRED_COUPON' | 'NOT_YET_VALID';
}

export interface DiscountStrategy {
  readonly name: DiscountName;
  isApplicable(ctx: DiscountContext): boolean;
  apply(ctx: DiscountContext): DiscountResult;
}
```

En código, `apply()` devuelve `{ result, ctx }` (`StrategyOutcome`) para que `remainingAmount` fluya al siguiente paso (necesario para cupones de categoría). El `DiscountResult` del SDD sigue siendo el contrato HTTP de cada línea del breakdown.

**Importante:** `discount-service` recibe `resolvedCoupon` **ya resuelto** — no recibe el `couponCode` en texto. Quien decide si el código existe, está activo, y si `now` cae dentro de `[valid_from, valid_to]` es `coupon-service` (§04 "Vigencia = dos fechas, no una"). Si `discount-service` empieza a validar cupones, es una fuga de responsabilidad — repórtalo si lo ves en una sugerencia de IA.

## 7. Pasos de implementación (orden exacto)

1. Definir las interfaces de la sección 6 en `strategies/discount-strategy.interface.ts`.
2. Implementar `CategoryDiscountStrategy`: aplica 10% solo a `lines` con `category === 'Tecnologia'`.
3. Implementar `VolumeDiscountStrategy`: aplica 5% sobre `runningSubtotal` completo si `runningSubtotal > 10000` (centavos = $100).
4. Implementar `CouponDiscountStrategy`: si `resolvedCoupon` existe, aplica `discountPercent` sobre las líneas objetivo (todas si `scope==='GLOBAL'`, solo las de `categoryName` si `scope==='CATEGORY'`) — código exacto en SDD §04.
5. Implementar `DiscountStrategyFactory.buildPipeline()`: devuelve `[category, volume, coupon]` en ese orden fijo.
6. Implementar `DiscountEngineService.calculate()`: recorre el pipeline, acumula, y al final llama `applyAbsoluteCap()`.
7. Implementar `applyAbsoluteCap()` como **método puro separado**, no inline al final del loop — se testea en aislamiento (paso 9).
8. Recién ahora, conectar `discount-engine.controller.ts` con el endpoint HTTP.
9. Escribir las pruebas (siguiente sección) **antes de mover al siguiente servicio**.

## 8. Pruebas unitarias — obligatorio 80%, aquí realista pedir 95%

Este es el módulo más crítico del sistema entero (SDD §12 le pide 95%, no el 80% genérico). Casos obligatorios, todos con referencia directa al SDD:

- `CategoryDiscountStrategy`: aplica solo a líneas Tecnología; no aplica si no hay ninguna; no toca líneas de otras categorías.
- `VolumeDiscountStrategy`: umbral exacto en $100.00 — no aplica en exactamente 100.00, aplica en 100.01 (SDD EC "volumen en umbral exacto").
- `CouponDiscountStrategy` con `scope: GLOBAL` vs `scope: CATEGORY` — verificar que un cupón de categoría **no** toca líneas de otra categoría.
- **`applyAbsoluteCap` en aislamiento**: inyectar un `DiscountContext` sintético donde el descuento bruto sea 50% del original → debe truncar a exactamente 35%. **No intentes forzar esto armando un carrito real** — con las 3 reglas fijas el máximo matemático es 27.325% (SDD §04); con un cupón `TECH30` (30%, categoría) sobre un carrito 100% Tecnología sí se alcanza (ejemplo 2 del SDD) — usa ese caso como prueba de integración, y el 50% sintético como prueba unitaria pura del guard.
- Carrito vacío (`lines: []`) → `originalSubtotal = 0`, sin división por cero, `effectiveDiscountPercentage = 0`.
- Aritmética: ejecutar el ejemplo trabajado del SDD §04 ($780 → $569.29) y afirmar el resultado en centavos exactos (`56929`), no en `number` flotante sin redondeo.

```ts
// jest.config.ts / vitest.config.ts de este servicio
export default {
  coverageThreshold: {
    global: { statements: 95, branches: 95, functions: 95, lines: 95 },
  },
};
```

Comando: `pnpm --filter discount-service test:coverage`

## 9. Cómo correrlo localmente

```bash
pnpm --filter discount-service dev      # puerto 3001
curl -X POST localhost:3001/internal/discounts/calculate \
  -H "X-Internal-Token: $INTERNAL_SERVICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"originalSubtotal":78000,"lines":[...]}'
```

No necesita Docker Compose para probarse aislado — es Node puro. Sí entra en `docker-compose.yml` para que `order-service` pueda llamarlo por nombre de host (`http://discount-service:3001`).

## 10. Despliegue en GCP (Nivel Enterprise, SDD §11)

El `Dockerfile` real de este paquete usa `npm install` (no hay `package-lock.json` aquí). El Service es **ClusterIP** — nunca LoadBalancer (SDD §07/§11).

El SDD §11 nombra el namespace `ecommerce-prod` y el ejemplo ilustra 2 réplicas. El cluster GKE de esta entrega ya usa `ecommerce` (monolito frontend/backend); el manifiesto vivo `k8s/discount-service.yaml` despliega ahí, ClusterIP, 1 réplica Autopilot (ahorro de costo en este incremento), sin PVC ni Secret de DB. Llamada interna: `http://discount-service.ecommerce.svc.cluster.local:3001`.

## 11. Definition of Done antes de pasar al siguiente servicio

- [ ] Cobertura ≥95% en `pnpm test:coverage`, verificada en consola.
- [ ] El ejemplo numérico del SDD §04 pasa como test de integración exacto.
- [ ] `applyAbsoluteCap` probado en aislamiento con inyección sintética.
- [ ] Cero imports de Nest/Prisma/HTTP dentro de `strategies/` — solo en `discount-engine.controller.ts`.
- [ ] `Dockerfile` construye y el contenedor responde en `:3001`.
