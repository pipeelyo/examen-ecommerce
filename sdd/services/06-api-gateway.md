# `api-gateway`

> El único punto público. Constrúyelo **último** — sin los otros cinco servicios corriendo, no hay nada útil que enrutar. Ver SDD §01, §03, §07, §08.

## 1. Responsabilidad (y qué NO hace)

| Hace | No hace |
|---|---|
| Termina HTTPS del cliente, verifica el JWT de Supabase, enruta a los servicios internos | No contiene lógica de negocio — es una capa de enrutamiento + autenticación + agregación |
| Expone el stream SSE hacia el navegador (suscrito a Redis Pub/Sub) | No calcula descuentos ni toca ninguna base de datos directamente |
| Publica el Swagger agregado de toda la API pública en `/api/docs` | No reenvía el JWT del usuario a los servicios internos — les pasa `X-Internal-Token` + `X-User-Role` (SDD §08) |

## 2. Prerrequisitos

Los cinco servicios anteriores corriendo (`docker compose up` sin `api-gateway` primero, para probarlos por separado; luego sí, todos juntos).

## 3. Variables de entorno

```
PORT=3000
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_JWKS_URL=https://xxxx.supabase.co/auth/v1/.well-known/jwks.json
CATALOG_SERVICE_URL=http://catalog-service:3002
COUPON_SERVICE_URL=http://coupon-service:3003
DISCOUNT_SERVICE_URL=http://discount-service:3001
ORDER_SERVICE_URL=http://order-service:3004
REDIS_URL=redis://redis:6379
INTERNAL_SERVICE_TOKEN=<mismo secreto compartido con los demas>
```

## 4. Estructura de carpetas

```
services/api-gateway/
├── src/
│   ├── auth/
│   │   ├── supabase-auth.adapter.ts    # patron Adapter, SDD §03
│   │   ├── supabase-auth.guard.ts      # opcional: no rechaza si no hay token
│   │   └── roles.guard.ts
│   ├── sse/
│   │   └── sse.gateway.ts              # suscribe a Redis, reenvia por EventSource
│   ├── proxy/
│   │   ├── products.proxy.controller.ts
│   │   ├── coupons.proxy.controller.ts
│   │   └── checkout.proxy.controller.ts
│   └── main.ts
├── test/unit/
│   ├── supabase-auth.guard.spec.ts
│   └── roles.guard.spec.ts
├── Dockerfile
└── package.json
```

## 5. Rutas públicas (tabla completa, SDD §07)

| Método | Ruta | Reenvía a | Auth |
|---|---|---|---|
| `GET` | `/api/v1/products` | `catalog-service GET /products` | Pública |
| `POST` | `/api/v1/products` | `catalog-service POST /admin/products` | `role=ADMIN` |
| `PATCH` | `/api/v1/products/:id` | `catalog-service PATCH /admin/products/:id` | `role=ADMIN` |
| `PATCH` | `/api/v1/products/:id/stock` | `catalog-service PATCH /admin/products/:id/stock` | `role=ADMIN` |
| `DELETE` | `/api/v1/products/:id` | `catalog-service DELETE /admin/products/:id` | `role=ADMIN` |
| `GET` | `/api/v1/coupons/available` | `coupon-service GET /available` | Pública |
| `GET` | `/api/v1/coupons/:code` | `coupon-service GET /:code` | Pública |
| `POST` | `/api/v1/coupons` | `coupon-service POST /admin/coupons` | `role=ADMIN` |
| `PATCH` | `/api/v1/coupons/:id` | `coupon-service PATCH /admin/coupons/:id` | `role=ADMIN` |
| `POST` | `/api/v1/checkout/preview` | llama directo a `coupon-service` + `discount-service` (sin pasar por `order-service`) | Opcional |
| `POST` | `/api/v1/checkout` | `order-service POST /checkout` | Opcional (invitado, HU5) |
| `GET` | `/api/v1/orders/:id` | `order-service GET /:id` | `Customer`/`Admin` |
| `PATCH` | `/api/v1/users/me/profile` | `order-service PATCH /users/me/profile` | `Customer` |
| `GET` | `/api/v1/admin/audit` | Consulta directa a `_x27f_evt_trace` vía función `SECURITY DEFINER` | `Admin` |
| `GET` | `/api/v1/orders/:id/events` | SSE — suscribe al canal Redis, filtra por `orderId` | `Customer` dueño de la orden |

## 6. Auth — lo único no trivial de este servicio

```ts
// supabase-auth.guard.ts — OPCIONAL, no bloquea si no hay token (necesario para invitados, HU5)
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const token = extractBearer(req.headers.authorization);
    if (!token) return true;                 // sigue como invitado, no rechaza
    const payload = await verifyAgainstJwks(token, cachedJwks);  // via jose, cache del JWKS
    req.user = { id: payload.sub, roles: await resolveRoles(payload.sub) };
    return true;
  }
}

// roles.guard.ts — este SI rechaza, se usa solo en rutas /admin/*
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly required: string[]) {}
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    if (!req.user) throw new UnauthorizedException();
    if (!this.required.every(r => req.user.roles.includes(r))) throw new ForbiddenException();
    return true;
  }
}
```

Cada proxy controller adjunta `X-Internal-Token` e, si `req.user` existe, `X-User-Id` / `X-User-Role` al reenviar — los servicios internos leen esos headers, no un JWT (SDD §08 "Autenticación servicio-a-servicio").

## 7. Pasos de implementación

1. `SupabaseAuthGuard` + cache del JWKS (revalidar cada X minutos, no en cada request).
2. `RolesGuard` parametrizable, aplicado solo a las rutas `/admin/*`.
3. Proxies HTTP simples (usar `@nestjs/axios` o `undici`) — cada proxy envuelve su llamada saliente con `opossum` (circuit breaker, SDD §10).
4. `sse.gateway.ts`: al conectar un cliente a `/api/v1/orders/:id/events`, suscribirse al canal Redis y filtrar los eventos por `orderId`; soportar el header `Last-Event-ID` para reconexión.
5. Montar Swagger agregando los DTOs de `packages/shared-contracts`.
6. Solo al final, levantar `docker-compose.yml` completo con los 6 servicios y probar el camino feliz de punta a punta desde el navegador.

## 8. Pruebas unitarias — 80% mínimo

- `SupabaseAuthGuard`: request sin token → pasa como invitado (`req.user` es `undefined`, no lanza).
- `SupabaseAuthGuard`: token inválido/expirado → 401.
- `RolesGuard`: usuario `CUSTOMER` contra una ruta `ADMIN` → 403; sin `req.user` → 401 (no 403 — son casos distintos).
- Proxy con circuit breaker abierto → 503 con `Retry-After`, sin reintentar indefinidamente.
- `/api/v1/checkout/preview` nunca llama a `order-service` (verificar con un spy que el cliente HTTP de `order-service` no se invoca).

```ts
coverageThreshold: { global: { statements: 80, branches: 80, functions: 80, lines: 80 } }
```

Comando: `pnpm --filter api-gateway test:coverage`

## 9. Cómo correrlo localmente (con todo el sistema)

```bash
docker compose up   # levanta los 6 servicios + Postgres + Redis
open http://localhost:3000/api/docs   # Swagger agregado
```

Este es el único comando que un evaluador necesita ver correr durante la demo.

## 10. Despliegue en GCP

Es el único servicio con Ingress público (SDD §11, Fig. 8):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: api-gateway, namespace: ecommerce-prod }
spec:
  replicas: 2
  strategy: { type: RollingUpdate }
  selector: { matchLabels: { app: api-gateway } }
  template:
    metadata: { labels: { app: api-gateway } }
    spec:
      serviceAccountName: sa-api-gateway
      containers:
        - name: api-gateway
          image: REGION-docker.pkg.dev/PROJECT/repo/api-gateway:SHA
          ports: [{ containerPort: 3000 }]
          envFrom: [{ secretRef: { name: api-gateway-secrets } }]
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: api-gateway-hpa, namespace: ecommerce-prod }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: api-gateway }
  minReplicas: 2
  maxReplicas: 6
  metrics: [{ type: Resource, resource: { name: cpu, target: { type: Utilization, averageUtilization: 70 } } }]
---
apiVersion: v1
kind: Service
metadata: { name: api-gateway, namespace: ecommerce-prod }
spec:
  selector: { app: api-gateway }
  ports: [{ port: 3000, targetPort: 3000 }]
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ecommerce-ingress
  namespace: ecommerce-prod
  annotations:
    kubernetes.io/ingress.class: gce
    networking.gke.io/managed-certificates: ecommerce-cert
spec:
  rules:
    - host: api.tu-dominio.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend: { service: { name: api-gateway, port: { number: 3000 } } }
```

Nota de infraestructura para el streaming SSE: en GKE, el Ingress/LB debe tener deshabilitado el buffering de respuesta y un timeout largo para las conexiones `/events` (`BackendConfig` con `timeoutSec` alto) — de lo contrario el proxy corta la conexión SSE antes de que el navegador reciba el push.

## 11. Definition of Done

- [ ] Camino feliz completo demostrable con un solo `docker compose up` (SDD checklist §15).
- [ ] `/api/docs` muestra todos los endpoints con sus DTOs correctos.
- [ ] Los 3 circuit breakers (a `catalog-service`, `coupon-service`, `discount-service` vía `order-service`, y a Supabase JWKS) son visibles/probables.
- [ ] Cobertura ≥80%.
- [ ] Checkout de invitado y checkout autenticado ambos funcionan de punta a punta.
