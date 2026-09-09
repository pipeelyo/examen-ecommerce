# Core E-Commerce — Sistema de Descuentos Acumulativos

Examen técnico (Kata E1): un checkout de e-commerce con un motor de descuentos en cascada, construido como 6
microservicios reales — no una maqueta — y desplegado en producción sobre GKE.

- **Demo en vivo:** http://35.226.83.92
- **Repo:** https://github.com/pipeelyo/examen-ecommerce
- **Stack:** React · NestJS · PostgreSQL (Supabase) · Redis · Kubernetes (GKE)

## Qué es esto

Un carrito de compras donde el descuento final se arma en **cascada multiplicativa**, no por suma:

```
subtotal → -10% líneas de Tecnología → -5% si el subtotal > $100 → -X% del cupón → tope absoluto del 35%
```

Cubre 6 historias de usuario obligatorias: catálogo con filtros, preview de descuento en vivo, checkout con
invitado (sin cuenta), cupones con vigencia y alcance por categoría, ajuste de inventario, y una bitácora de
auditoría con firma HMAC sobre cambios reales. Todo con cobertura de test ≥80% (90–98% en el motor de
descuentos y en `order-service`).

Para probarlo: entrá a la demo, elegí **CUSTOMER** o **ADMIN**, y usá el cupón `WELCOME2026` en el checkout.

## Arquitectura

Seis procesos NestJS independientes detrás de un único gateway público, más el frontend:

| Servicio | Puerto | Responsabilidad | Base de datos |
|---|---|---|---|
| `api-gateway` | 3000 | Único punto público, auth, conversión $↔centavos | — |
| `discount-service` | 3001 | Motor de descuentos (cómputo puro, sin estado) | — |
| `catalog-service` | 3002 | Productos, categorías, reserva/liberación de stock | `catalog` |
| `coupon-service` | 3003 | Vigencia y alcance de cupones | `coupon` |
| `order-service` | 3004 | Orquesta la Saga de checkout, persiste la orden | `order` |
| `notification-service` | — (async) | Consume eventos de orden vía Redis, notifica | — |

Un solo Postgres (Supabase), un schema por servicio — sin JOIN cruzado entre schemas. El checkout se resuelve
con el patrón **Saga** (reservar stock → resolver cupón → calcular descuento → persistir orden), con
compensación explícita si algo falla a mitad de camino. Los eventos de orden salen por **Outbox transaccional +
Redis Pub/Sub**, no un broker separado.

El proyecto está diseñado en dos niveles explícitos: **MVP** (todo lo de esta lista, corriendo hoy en
producción) y **Enterprise** (HPA multi-réplica, broker durable, Row-Level Security — documentado y con las
interfaces ya listas, pero sin la infraestructura pesada levantada para esta entrega).

Diagramas completos (18 figuras con su "por qué / decisión") y la sustentación técnica:

- [`sdd/diagrams/`](sdd/diagrams/) — C4, secuencias de checkout/stock/cupones, saga, ER, despliegue, auditoría
- [`sdd/sustentacion/`](sdd/sustentacion/) — slides + guion de la sustentación en vivo
- [`sdd/README.md`](sdd/README.md) — runbook por microservicio, en orden de construcción

## Por qué este stack

| Capa | Se eligió | Se descartó | Por qué (resumen) |
|---|---|---|---|
| Frontend | React 19 + Vite + Zustand | Angular | El límite real de dominio está en los 6 microservicios, no en la UI — Angular es sobre-ingeniería para un carrito + 3 vistas admin |
| Backend | NestJS + TypeScript | Express/Fastify a mano | Con 6 procesos independientes, la convención (módulo → controller → service → guard) importa más que la libertad |
| Base de datos | PostgreSQL vía Supabase + Prisma | MongoDB / Postgres autoadministrado | ACID real para reservar stock, triggers + pgcrypto para auditoría HMAC, Auth + DB + pooling en un solo proveedor |
| Mensajería | Redis Pub/Sub + Outbox | RabbitMQ | Ya estaba para pool/cache; un broker durable es infraestructura extra para el volumen de esta entrega |
| Despliegue | GKE + Workload Identity Federation | Self-managed K8s / llaves de service account | Sin llaves de larga vida: GitHub Actions obtiene credenciales temporales de GCP IAM en cada corrida |
| Calidad | SonarCloud | SonarQube autoadministrado | Repo público → gratis, cero infraestructura nueva |

El razonamiento completo de cada decisión (con las alternativas explícitamente descartadas) está en
[`sdd/diagrams/`](sdd/diagrams/) y en [`sdd/sustentacion/guion-15min.md`](sdd/sustentacion/guion-15min.md).

## Estructura del repo

```
examen-ecommerce/
├── apps/
│   ├── frontend/                     # React + Vite + Zustand + Radix
│   └── backend/
│       ├── services/
│       │   ├── api-gateway/          # NestJS — único punto público
│       │   ├── catalog-service/      # NestJS + Prisma (schema catalog)
│       │   ├── coupon-service/       # NestJS + Prisma (schema coupon)
│       │   ├── discount-service/     # NestJS — motor de descuentos, sin DB
│       │   ├── order-service/        # NestJS + Prisma (schema order) — Saga
│       │   └── notification-service/ # NestJS — consumidor Redis
│       └── src/                      # prototipo monolítico previo (legacy, aún testeado en CI)
├── packages/
│   ├── discount-engine/              # cascada de descuentos como paquete puro
│   └── shared-contracts/             # DTOs/fixtures compartidos
├── k8s/                              # manifiestos de despliegue (GKE)
├── sdd/                              # documentación técnica real (diagramas, runbooks, sustentación)
├── .github/workflows/deploy.yml      # CI (lint+test+coverage+Sonar) y CD (build+push+rollout)
└── sonar-project.properties
```

## Cómo correrlo local

Requiere Node.js ≥ 20.

```bash
git clone https://github.com/pipeelyo/examen-ecommerce.git
cd examen-ecommerce
npm install
```

### Build y tests (no necesita ninguna base de datos)

Todos los repositorios que tocan la base de datos están mockeados en los tests unitarios — `npm test` corre
sin Postgres ni Redis levantados.

```bash
npm run build          # build de los 8 workspaces
npm test               # tests de todo el monorepo
npm run test:coverage  # con reporte de cobertura (lcov) por servicio
```

### Opción rápida: solo el frontend, con datos de ejemplo

La forma más simple de ver la app funcionando sin levantar ningún backend:

```bash
cd apps/frontend
cp .env.example .env.local   # ya trae VITE_USE_MOCKS=true
npm run dev                  # http://localhost:5173
```

Corre contra un Service Worker (MSW) con productos, cupones y órdenes de ejemplo — catálogo, carrito, checkout
de invitado y el panel admin completo, sin backend real.

### Backend real, servicio por servicio

Cada microservicio corre de forma aislada con `npm run dev -w <nombre>`:

```bash
npm run dev -w discount-service   # :3001 — sin base de datos, arranca solo
npm run dev -w catalog-service    # :3002 — necesita Postgres (ver abajo)
npm run dev -w coupon-service     # :3003 — necesita Postgres
npm run dev -w order-service      # :3004 — necesita Postgres + los tres anteriores corriendo
npm run dev -w notification-service
npm run dev -w api-gateway        # :3000 — necesita todo lo anterior detrás
```

Cada servicio trae su propio `.env.example` (copiarlo a `.env`). `catalog-service` tiene un valor por defecto
para Postgres local (`localhost:5432`); `coupon-service` y `order-service` están pensados para apuntar a
Supabase (pedir las credenciales del proyecto, o levantar tu propio Postgres con un schema por servicio). El
orden de arranque recomendado y el detalle de cada uno están en [`sdd/README.md`](sdd/README.md).

Con el gateway arriba, la documentación interactiva de la API queda en `http://localhost:3000/api/docs`.

## CI/CD y despliegue

`.github/workflows/deploy.yml`, dos jobs:

1. **test** — `npm ci` → build → tests con cobertura (gate ≥80%, más estricto en el motor y en cupones) →
   análisis de SonarCloud.
2. **deploy** (solo en push a `main`) — build de 7 imágenes Docker, push a Artifact Registry, y rollout en GKE.
   La autenticación hacia GCP es sin llaves: Workload Identity Federation le da al runner de GitHub
   credenciales temporales de IAM en cada corrida.

Cluster real: proyecto GCP `round-seeker-309101`, región `us-central1`, namespace `ecommerce`. Solo el
`frontend` es `LoadBalancer` (único servicio expuesto a Internet); el resto son `ClusterIP`, inalcanzables
desde afuera del cluster.

## Estado actual

Esto corre en producción, no es una maqueta:

- 6 microservicios reales en GKE, con Postgres real en Supabase (triggers de auditoría activos sobre datos
  reales)
- Frontend completo: catálogo, carrito, checkout de invitado, panel admin con 3 vistas
- Login demo + Google OAuth (Supabase Auth) en paralelo
- CI/CD funcionando de punta a punta en cada push a `main`

Pendiente y declarado (nivel Enterprise, no MVP): Row-Level Security en las tablas de Supabase, HPA
multi-réplica, y conectar el JWT real de Google a las rutas del checkout (hoy conviven con el token demo del
contrato de API congelado).

## Documentación adicional

- [`sdd/README.md`](sdd/README.md) — runbook por microservicio (orden de construcción, dependencias, cómo
  probar cada uno aislado)
- [`sdd/diagrams/`](sdd/diagrams/) — 18 diagramas de arquitectura con su razonamiento
- [`sdd/sustentacion/`](sdd/sustentacion/) — slides y guion de la sustentación técnica
- [`sdd/gobernanza-con-ia/`](sdd/gobernanza-con-ia/) — cómo se usó IA durante la construcción del proyecto
- [`sdd/sdd-core-ecommerce.html`](sdd/sdd-core-ecommerce.html) — Software Design Document base
