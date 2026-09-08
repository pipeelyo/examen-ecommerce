# Core E-Commerce — Guía de implementación por microservicio

Este folder acompaña al SDD base (`sdd-core-ecommerce.html`, en esta misma carpeta). Cada archivo en `services/` es un runbook autocontenido para un microservicio: qué construir, qué probar, cómo correrlo y cómo desplegarlo — en el **orden en que deben construirse y encenderse**, no alfabético.

## Orden de ejecución

| # | Servicio | Por qué en este orden | Dependencias en runtime |
|---|---|---|---|
| 1 | [`discount-service`](services/01-discount-service.md) | Sin dependencias, sin base de datos — feedback más rápido de todo el sistema | Ninguna |
| 2 | [`catalog-service`](services/02-catalog-service.md) | Necesita Supabase, pero nada más | Postgres (schema `catalog`) |
| 3 | [`coupon-service`](services/03-coupon-service.md) | Igual que catalog-service, independiente de él | Postgres (schema `coupon`) |
| 4 | [`order-service`](services/04-order-service.md) | El orquestador — necesita 1, 2 y 3 ya corriendo para probarse de punta a punta | 1, 2, 3, Redis, Postgres (schema `order`) |
| 5 | [`notification-service`](services/05-notification-service.md) | Consume lo que `order-service` publica — no tiene sentido antes | 4, Redis |
| 6 | [`api-gateway`](services/06-api-gateway.md) | Único punto público — necesita todo lo demás corriendo detrás | 1 – 5, Supabase Auth |

## Cómo probar cada uno de forma aislada

Cada MD tiene su propia sección "Cómo correrlo localmente" — la idea es que puedas hacer `pnpm --filter <servicio> dev` y `pnpm --filter <servicio> test:coverage` sin levantar el resto, excepto donde el propio runbook dice explícitamente que necesita a otro (ej. `order-service` necesita a los tres primeros).

## `docker-compose.yml` de referencia (todos juntos)

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:16-alpine
    environment: { POSTGRES_DB: core_ecommerce, POSTGRES_USER: postgres, POSTGRES_PASSWORD: postgres }
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  discount-service:
    build: ./apps/backend/services/discount-service
    ports: ["3001:3001"]

  catalog-service:
    build: ./apps/backend/services/catalog-service
    ports: ["3002:3002"]
    depends_on: [postgres]
    env_file: ./apps/backend/services/catalog-service/.env

  coupon-service:
    build: ./apps/backend/services/coupon-service
    ports: ["3003:3003"]
    depends_on: [postgres]
    env_file: ./apps/backend/services/coupon-service/.env

  order-service:
    build: ./apps/backend/services/order-service
    ports: ["3004:3004"]
    depends_on: [postgres, redis, catalog-service, coupon-service, discount-service]
    env_file: ./apps/backend/services/order-service/.env

  notification-service:
    build: ./apps/backend/services/notification-service
    depends_on: [redis, order-service]

  api-gateway:
    build: ./apps/backend/services/api-gateway
    ports: ["3000:3000"]
    depends_on: [catalog-service, coupon-service, discount-service, order-service]
    env_file: ./apps/backend/services/api-gateway/.env

volumes:
  pgdata: {}
```

## Reglas que aplican a los seis (no repetidas en cada MD)

- **Cobertura de pruebas ≥80% siempre** (95% específicamente en `discount-service`, ver SDD §12) — el pipeline de CI falla si no se cumple, en cada servicio por separado.
- **TypeScript estricto, sin `any` implícito**, en los seis.
- **Ningún servicio interno es público** salvo `api-gateway` — en GKE, todos los demás son `ClusterIP` (SDD §11).
- **`X-Internal-Token`** es obligatorio en toda llamada entre servicios internos; ninguno confía en el JWT del usuario final salvo `api-gateway` (SDD §08).
- El **SDD (`sdd-core-ecommerce.html`) es la fuente de verdad** — si algo en un MD de servicio contradice al SDD, gana el SDD y hay que corregir el MD, no al revés.

## Orden sugerido de commits (para que el historial de GitHub cuente la misma historia)

1. `feat(discount-service): motor de descuentos con tope 35%`
2. `feat(catalog-service): catalogo, CRUD admin y reserva de stock`
3. `feat(coupon-service): cupones con vigencia y alcance por categoria`
4. `feat(order-service): saga de checkout con compensacion`
5. `feat(notification-service): consumidor de order.events`
6. `feat(api-gateway): enrutamiento, auth Supabase y SSE`
7. `docs: arquitectura.md e ia.md`
