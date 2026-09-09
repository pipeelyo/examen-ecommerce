# `07-frontend-integration` — Merge del front real + cierre de contrato

> Insumo: `~/Downloads/examen-ecommerce.zip` (front React ya construido por otro equipo, fases 07-08, contra un `CONTRACT.md` congelado). Este documento es el equivalente de los `0X-*.md` anteriores pero para un paso distinto: no hay servicio nuevo que crear, hay que **hacer que `api-gateway` + `coupon-service` + `catalog-service` cumplan exactamente un contrato que ya no se puede tocar**. Regla de oro del propio handoff del front, cítala tal cual en cualquier PR: *"No cambies DTOs, paths ni el motor del contrato. Si algo no calza, se ajusta la implementación al CONTRACT, no se inventa otro shape en el front."*

## 0. Qué es este front y por qué manda él

- Vive en `apps/frontend/` del zip (Vite + React + Zustand + Radix + Tailwind), corre hoy 100% contra MSW (`VITE_USE_MOCKS=true`).
- Su contrato — `docs/plans/CONTRACT.md` — es la fuente de verdad de rutas, DTOs, códigos de error, modelo de auth, caso dorado (569.29) y semilla exigida. **No es una propuesta, es lo que el front ya invoca literalmente** desde `src/shared/api/client.ts` / `commerce.ts`.
- Trae su propio paquete `packages/shared-contracts` (tipos + fixture dorado) que hoy no choca con nada del monorepo real (que solo tiene `packages/discount-engine`).
- El módulo `admin/` del front (ProductDesk, CouponDesk, AuditLedger) es **mock-only a propósito** — el propio handoff dice *"No hay rutas admin en el CONTRACT. No las implementes para el MVP"*. No lo conectes a `api-gateway`; déjalo con MSW.

## 1. Tabla de brechas — CONTRACT.md vs lo ya construido

Siete brechas reales, ninguna estructural: el motor de descuentos (`discount-engine.service.ts`) ya devuelve `originalSubtotal / breakdown:{category,volume,coupon,cappedAt35} / totalDiscount / effectiveDiscountPercentage / finalTotal` — **los nombres de campo del CONTRACT ya están bien**, solo falta la capa de traducción en el borde público.

| # | Contrato exige | Hoy tenemos | Dónde se toca |
|---|---|---|---|
| 1 | Rutas bajo `/api/v1/*` (gateway lo sirve directo, sin depender de nginx) | Gateway expone `/products`, `/checkout`, etc. sin prefijo; nginx lo compensa reescribiendo, pero solo para tráfico que pasa por nginx | `api-gateway/src/main.ts`, `apps/frontend/nginx.conf` |
| 2 | `ProductDto = {id, name, category, price, stock}`, `id` string estable (`p-laptop`) | `catalog-service` devuelve `{id(uuid), sku, unitPrice, categoryId, categoryName, active,...}`; `GET /products/:id` usa `ParseUUIDPipe` | `catalog-service` seed + guard; `api-gateway/src/products/products.controller.ts` |
| 3 | `GET /coupons/:code` → **404** si el código no existe; 200 `{valid:false}` solo si existe pero está vencido/inactivo | `coupon-service.resolveCoupon` colapsa "no existe" e "inactivo" en el mismo `INVALID_COUPON`, y `GET /:code` siempre devuelve 200 | `coupon-service/src/resolve-coupon.ts`, `coupons.controller.ts` |
| 4 | `CouponValidDto.discountPct` en formato fracción (`0.15`), campo `reason?:'INVALID'\|'EXPIRED'` | Motor interno usa `discountPercent` entero (`15`) y vocabulario `INVALID_COUPON\|EXPIRED_COUPON\|NOT_YET_VALID` | Nuevo mapper en `api-gateway/src/coupons/` |
| 5 | Montos en dólares con hasta 2 decimales (`finalTotal:569.29`) | `discount-engine` trabaja 100% en centavos enteros; `checkout.controller.ts` hace `res.json({orderId:null, ...result.breakdown})` **sin reconvertir** — hoy devolvería `56929`, no `569.29` | `api-gateway/src/checkout/checkout.controller.ts` (nuevo `centsToDollars`) |
| 6 | `POST /checkout` y `GET /orders/:id` → 401 si falta/está vacío el Bearer; `preview` nunca lo exige | No existe ningún guard de auth en el gateway — ninguna ruta pide token | Nuevo `bearer-auth.guard.ts` en `api-gateway` |
| 7 | Errores con forma `ApiErrorDto {code,message,fields?,details?}` y vocabulario fijo (`VALIDATION_ERROR`, `CART_EMPTY`, `STOCK_INSUFFICIENT` con `details.productId`, etc.) | Nest devuelve `{statusCode,message,error}` por defecto; no hay validación de payload ni chequeo de carrito vacío en ningún lado | Nuevo `ExceptionFilter` global en `api-gateway` + DTOs con `class-validator` |

Deuda menor, no bloqueante: el propio `packages/shared-contracts/src/golden.ts` del front trae `effectiveDiscountPercentage: 27.01` mientras la prosa de `CONTRACT.md` dice `27.02` — es inconsistencia interna de ellos; nuestro cálculo real (78000→70500→66975→56929, `56929/78000=27.019...`→redondea a `27.02`) coincide con la prosa, no con el fixture. No lo toques; si el smoke test falla por esto es un bug de ellos, repórtalo, no lo "arregles" cambiando el motor.

## 2. Fix por fix, en orden de ejecución

### 2.1 Prefijo `/api/v1` (gateway + nginx)

```ts
// api-gateway/src/main.ts
app.setGlobalPrefix("api/v1", { exclude: ["health", "status"] });
```

`nginx.conf` hoy usa `proxy_pass http://api-gateway:3000/;` con slash final, que **le quita** el prefijo antes de reenviar — eso rompía la ruta apenas el gateway empezara a exigirla. Cámbialo a preservarlo:

```nginx
location /api/v1/ {
  proxy_pass http://api-gateway:3000;   # sin slash final: conserva /api/v1/... en el upstream
  proxy_connect_timeout 2s;
  proxy_read_timeout 10s;
  proxy_next_upstream error timeout http_502 http_503;
}
```

Así, tanto el navegador vía nginx (`/api/v1/products` → nginx → gateway en `/api/v1/products`) como el front pegándole directo al gateway en dev (`VITE_API_URL=http://localhost:3000`, sin nginx de por medio) funcionan con la misma ruta.

### 2.2 `ProductDto` — mapper + ids estables

**catalog-service**: la única razón para usar UUID era "buena práctica" — el contrato no lo exige y de hecho lo prohíbe (`p-laptop` no es UUID válido). Quita `ParseUUIDPipe` de `getById` en `products.controller.ts` (queda `@Param("id") id: string`) y resiembra con los 4 productos exactos del contrato usando esos ids como PK explícita:

```ts
// catalog-service/prisma/seed.ts (agregar/reemplazar filas)
const seed = [
  { id: "p-laptop", sku: "LAPTOP-01", name: "Laptop", unitPrice: 700, categoryName: "Tecnología", stock: 10 },
  { id: "p-mouse",  sku: "MOUSE-01",  name: "Mouse",  unitPrice: 50,  categoryName: "Tecnología", stock: 20 },
  { id: "p-libro",  sku: "LIBRO-01",  name: "Libro",  unitPrice: 30,  categoryName: "Libros",     stock: 15 },
  { id: "p-silla",  sku: "SILLA-01",  name: "Silla",  unitPrice: 349, categoryName: "Muebles",    stock: 0  },
];
```

Prisma acepta un `id` explícito en `create()` aunque el schema tenga `@default(uuid())` — no hace falta tocar el schema, solo pasar `id` en el seed. Deja el resto del catálogo (si hay más productos de prueba) con UUID normal; el contrato solo exige que estos 4 existan con esos ids.

**api-gateway**: hoy `ProductsController` hace `relay()` puro (reenvía el body de `catalog-service` tal cual). Se necesita una función pura de mapeo, testeable sin red:

```ts
// api-gateway/src/products/product.mapper.ts
export interface CatalogProductRecord {
  id: string; name: string; unitPrice: number; categoryName: string; stock: number; active: boolean;
}
export interface ProductDto {
  id: string; name: string; category: string; price: number; stock: number;
}
export function toProductDto(record: CatalogProductRecord): ProductDto {
  return { id: record.id, name: record.name, category: record.categoryName, price: record.unitPrice, stock: record.stock };
}
```

Aplícalo en `list()` y `getById()` de `products.controller.ts`: en vez de `relay(res, await forward(...))`, desestructura `{status, body}`, y si `status===200` mapea el body (array u objeto) con `toProductDto`/`.map(toProductDto)` antes de responder; si no es 200, deja pasar el error tal cual (lo normaliza el filtro global, ver 2.6).

### 2.3 Coupon: distinguir 404 de "existe pero inválido"

`resolveCoupon` en `coupon-service/src/resolve-coupon.ts` hoy hace `if (!record) return {applied:false, reason:"INVALID_COUPON"}`. Cambia el vocabulario para separar el caso:

```ts
export type CouponReason = "NOT_FOUND" | "INVALID_COUPON" | "EXPIRED_COUPON" | "NOT_YET_VALID";
// ...
if (!record) {
  return { applied: false, reason: "NOT_FOUND" };
}
if (!record.active) {
  return { applied: false, reason: "INVALID_COUPON" };
}
```

`coupons.service.ts`/`coupons.controller.ts` — el endpoint público `GET /:code` debe traducir `NOT_FOUND` a un 404 real en vez de un 200 disfrazado:

```ts
// coupons.controller.ts
@Get(":code")
async checkCode(@Param("code") code: string) {
  const result = await this.coupons.resolve(code);
  if (!result.applied && result.reason === "NOT_FOUND") {
    throw new NotFoundException({ code: "NOT_FOUND", message: `Cupón ${code} no existe` });
  }
  return result;
}
```

Ojo: `POST /internal/coupons/resolve` (usado por `checkout.controller.ts`/`preview.orchestrator.ts` del gateway) **debe seguir devolviendo 200 con el `reason` crudo** — ese endpoint interno no es el que el contrato regula, y el gateway ya trata "no aplica" y "no existe" igual (`resolvedCoupon = result.applied ? result.coupon : undefined`), así que no rompe nada dejar `NOT_FOUND` fluyendo ahí sin lanzar excepción.

### 2.4 `CouponValidDto` — mapper en el gateway

`api-gateway/src/coupons/coupons.controller.ts` hoy también hace `relay()` puro para `GET /:code`. Reemplázalo por una llamada explícita + mapeo (y ya no un simple forward, porque hay que traducir el 404 y el shape):

```ts
// api-gateway/src/coupons/coupon.mapper.ts
type EngineReason = "INVALID_COUPON" | "EXPIRED_COUPON" | "NOT_YET_VALID";
type ContractReason = "INVALID" | "EXPIRED";

const REASON_MAP: Record<EngineReason, ContractReason> = {
  INVALID_COUPON: "INVALID",
  EXPIRED_COUPON: "EXPIRED",
  NOT_YET_VALID: "INVALID", // el contrato no distingue "aún no vigente"
};

export function toCouponValidDto(code: string, result: ResolveResult) {
  if (result.applied) {
    return { code, valid: true, discountPct: result.coupon.discountPercent / 100 };
  }
  return { code, valid: false, reason: REASON_MAP[result.reason as EngineReason] };
}
```

```ts
// coupons.controller.ts (gateway)
@Get(":code")
async checkCode(@Param("code") code: string, @Res() res: Response) {
  const { status, body } = await forward(`${COUPON_URL()}/${code}`, { method: "GET", headers: internalHeaders() });
  if (status === 404) {
    res.status(404).json({ code: "NOT_FOUND", message: `Cupón ${code} no existe` });
    return;
  }
  res.status(200).json(toCouponValidDto(code, body as ResolveResult));
}
```

### 2.5 Centavos → dólares en el borde público

Nuevo helper puro, sin dependencias:

```ts
// api-gateway/src/common/money.ts
export function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}
export function convertBreakdownToDollars<T extends Record<string, unknown>>(breakdown: T): T {
  return {
    ...breakdown,
    originalSubtotal: centsToDollars(breakdown.originalSubtotal as number),
    totalDiscount: centsToDollars(breakdown.totalDiscount as number),
    finalTotal: centsToDollars(breakdown.finalTotal as number),
    breakdown: {
      ...(breakdown.breakdown as Record<string, unknown>),
      category: { ...(breakdown as any).breakdown.category, amount: centsToDollars((breakdown as any).breakdown.category.amount) },
      volume: { ...(breakdown as any).breakdown.volume, amount: centsToDollars((breakdown as any).breakdown.volume.amount) },
      coupon: { ...(breakdown as any).breakdown.coupon, amount: centsToDollars((breakdown as any).breakdown.coupon.amount) },
    },
  };
}
```

(Escríbela con tipos concretos —`CheckoutBreakdown`— en vez de `Record<string,unknown>`/`any`; aquí se deja genérica solo para que el snippet quepa. Los tipos ya existen en `discount-engine.service.ts` y se pueden reexportar vía `packages/shared-contracts`.)

Aplícalo en **los tres puntos de salida** de `checkout.controller.ts` — todos comparten el mismo shape de breakdown porque los tres terminan llamando al mismo `discount-engine`:

```ts
// preview
if (!result.ok) { ...; return; }
res.status(200).json({ orderId: null, ...convertBreakdownToDollars(result.breakdown) });

// checkout — el body que devuelve order-service ya trae {orderId, status, createdAt, ...breakdown en centavos}
const { status, body } = await forward(`${ORDER_URL()}/checkout`, {...});
if (status >= 400) { /* ver 2.6 */ }
res.status(status).json(convertBreakdownToDollars(body as CheckoutBreakdown));

// GET /orders/:id — mismo tratamiento
```

`order-service` y `discount-service` **no se tocan**: siguen en centavos internamente, que es lo correcto (evita floats en dinero en toda la cadena interna). La conversión vive únicamente en el único borde que habla con el mundo exterior.

### 2.6 Bearer guard + carrito vacío + filtro global de errores

```ts
// api-gateway/src/common/bearer-auth.guard.ts
@Injectable()
export class BearerAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const header = req.headers["authorization"];
    const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token) {
      throw new UnauthorizedException({ code: "UNAUTHORIZED", message: "Falta token Bearer" });
    }
    return true;
  }
}
```

Aplícalo solo a `POST /checkout` y `GET /orders/:id` en `checkout.controller.ts` (`@UseGuards(BearerAuthGuard)` a nivel de método, no de clase — `/checkout/preview` no debe llevarlo).

Carrito vacío — valida antes de llamar a `buildPreview`/reenviar a `order-service`, en ambos métodos (`preview` y `checkout`):

```ts
if (!body.items || body.items.length === 0) {
  throw new UnprocessableEntityException({ code: "CART_EMPTY", message: "El carrito está vacío" });
}
```

DTOs con `class-validator` (hoy `PreviewRequest`/`body: unknown` no validan nada) — crea `CheckoutRequestDto`/`PreviewRequestDto` con `@IsArray() @ArrayMinSize(1)` en `items` y `@IsUUID() / @IsString()` + `@IsInt() @Min(1)` en cada línea, y habilita el pipe global:

```ts
// main.ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
app.useGlobalFilters(new ApiErrorFilter());
```

Filtro global — traduce cualquier excepción Nest (incluida la del `ValidationPipe`) al shape `ApiErrorDto`, y cuando el body ya viene con `code` (porque tú mismo lo lanzaste con ese shape arriba) lo respeta tal cual:

```ts
// api-gateway/src/common/api-error.filter.ts
@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === "object" && body !== null && "code" in body) {
        res.status(status).json(body); // ya viene en forma ApiErrorDto
        return;
      }
      if (status === 400) {
        const validationBody = body as { message: string[] | string };
        res.status(400).json({ code: "VALIDATION_ERROR", message: "Payload inválido", fields: Array.isArray(validationBody.message) ? validationBody.message : [validationBody.message] });
        return;
      }
      res.status(status).json({ code: "UNKNOWN_ERROR", message: exception.message });
      return;
    }
    res.status(503).json({ code: "SERVICE_UNAVAILABLE", message: "Error interno" });
  }
}
```

Para `STOCK_INSUFFICIENT` (409, viene de `order-service`) y `SERVICE_UNAVAILABLE` (503, también de `order-service`): esas respuestas llegan al gateway ya con `status>=400` desde `forward()`, pero el body de `order-service` hoy es el suyo propio, no `ApiErrorDto`. Como `order-service` no es parte del contrato público, lo más simple es normalizar en `checkout.controller.ts` justo al recibir la respuesta del `forward()`, no en el filtro (el filtro solo atrapa excepciones lanzadas dentro del propio gateway):

```ts
if (status === 409) {
  res.status(409).json({ code: "STOCK_INSUFFICIENT", message: "Stock insuficiente", details: { productId: (body as any).productId } });
  return;
}
if (status >= 500) {
  res.status(503).json({ code: "SERVICE_UNAVAILABLE", message: "Servicio no disponible" });
  return;
}
```

## 3. Merge físico del front al monorepo

```bash
# desde la raíz del monorepo real
rm -rf apps/frontend            # el placeholder actual — confirmar con `git status` antes, no debe tener trabajo sin commitear
cp -r /tmp/frontend-zip-inspect/examen-ecommerce/apps/frontend apps/frontend
cp -r /tmp/frontend-zip-inspect/examen-ecommerce/packages/shared-contracts packages/shared-contracts
```

Después del copy:
- Revisa `apps/frontend/package.json` — sus deps (zustand, radix, tailwind, sonner, lucide-react) deben quedar en el `package-lock.json` raíz; corre `npm install` desde la raíz una sola vez.
- `apps/frontend/.env.example` → crea `apps/frontend/.env` con `VITE_USE_MOCKS=false` y `VITE_API_URL=` apuntando al gateway real (vacío/relativo si sirves todo detrás de nginx en el mismo origen — el front debe pegarle a `/api/v1/...` relativo cuando corre servido por el mismo nginx que el resto).
- El **Dockerfile del front actual** (`apps/frontend/Dockerfile`, root-context multi-stage) probablemente ya sirve para este front — es Vite+build+nginx igual que el placeholder; solo confirma que el build stage usa Node 20 y que copia `packages/shared-contracts` si el front lo importa como workspace (`"shared-contracts": "workspace:*"` en su `package.json` — si existe esa referencia, el Dockerfile necesita copiar `packages/shared-contracts` antes de `npm ci`, igual que ya hace con los demás paquetes del monorepo).
- `k8s/gke.yaml` (deployment de `frontend`) no cambia — sigue siendo el único `LoadBalancer`.

No toques `apps/frontend/src/modules/admin/**` ni intentes conectarlo — es mock-only por diseño del propio front.

## 4. Smoke test (calcado del checklist de `FRONTEND-HANDOFF.md`, para correr después de aplicar 2.1-2.6)

```bash
curl -s $GATEWAY/api/v1/products | jq .                      # 200, 4 productos, ids p-laptop/p-mouse/p-libro/p-silla
curl -s $GATEWAY/api/v1/coupons/NOSUCH -o /dev/null -w '%{http_code}\n'   # 404
curl -s $GATEWAY/api/v1/coupons/WELCOME2026 | jq .            # 200 {valid:true, discountPct:0.15}
curl -s -X POST $GATEWAY/api/v1/checkout/preview -H 'Content-Type: application/json' \
  -d '{"items":[{"productId":"p-laptop","quantity":1},{"productId":"p-mouse","quantity":1},{"productId":"p-libro","quantity":1}],"couponCode":"WELCOME2026"}' \
  | jq .   # finalTotal debe dar 569.29, cappedAt35:false, effectiveDiscountPercentage:27.02
curl -s -X POST $GATEWAY/api/v1/checkout -H 'Content-Type: application/json' -d '{"items":[]}'   \
  -o /dev/null -w '%{http_code}\n'   # 422 CART_EMPTY
curl -s -X POST $GATEWAY/api/v1/checkout -H 'Content-Type: application/json' \
  -d '{"items":[{"productId":"p-laptop","quantity":1}]}' -o /dev/null -w '%{http_code}\n'   # 401, sin Bearer
curl -s -X POST $GATEWAY/api/v1/checkout -H 'Content-Type: application/json' -H 'Authorization: Bearer demo' \
  -d '{"items":[{"productId":"p-laptop","quantity":1}]}' | jq .   # 201, orderId uuid
```

Luego el front real: `npm run dev` en `apps/frontend` con `VITE_USE_MOCKS=false`, login demo (`ana.rios@norte.shop` / `sala2026`), armar el carrito del caso dorado, aplicar `WELCOME2026`, confirmar que el breakdown en pantalla coincide con el `curl` de arriba, y completar un checkout real de punta a punta viendo el pedido en `GET /orders/:id`.

## 5. Orden de trabajo sugerido

1. `catalog-service`: reseed + quitar `ParseUUIDPipe` (2.2) — aislado, sin tocar nadie más.
2. `coupon-service`: `NOT_FOUND` + 404 en `GET /:code` (2.3) — aislado.
3. `api-gateway`: todo lo demás (2.1, 2.4, 2.5, 2.6) — es el único servicio con cambios de verdad; hazlo en un solo commit porque el `ExceptionFilter` y el `ValidationPipe` afectan a todos los controllers a la vez.
4. Merge del front (sección 3) — commit aparte, sin lógica de negocio.
5. Smoke test (sección 4) contra el stack completo levantado localmente (`docker compose` o los 6 servicios + front en local dev) antes de generar el prompt de push/deploy para Cursor.

Como en los pasos anteriores: build + test en copia aislada, `npm run test:coverage` completo del monorepo, commit local sin push, y prompt de handoff para Cursor al final.
