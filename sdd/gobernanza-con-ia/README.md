# Gobernanza con IA

Entregable del árbol del curso:

```
gobernanza con IA
└── README.md  # Guía de instalación rápida y comandos para pruebas
```

En el monorepo la carpeta se llama `gobernanza-con-ia` (sin espacios; mismo contenido). Complementa `docs/ia.md` (rúbrica del examen, SDD §13) y explica **cómo se usó Cursor/Claude en este proyecto**, no una herramienta inventada.

Repo: [github.com/pipeelyo/examen-ecommerce](https://github.com/pipeelyo/examen-ecommerce)  
Fuente de verdad de diseño: `sdd/sdd-core-ecommerce.html` (si un MD de servicio choca con el HTML, gana el HTML).

---

## 1. Cómo se usó la IA en este kata

El flujo no fue “generar el repo y pegar”. El orden real:

1. **SDD primero.** Contratos, cascada, tope 35 %, bounded contexts y el caso dorado se cerraron en el HTML antes de implementar micros.
2. **Micros en el orden del runbook**, no alfabético: `discount-service` → `catalog-service` → `coupon-service` → `order-service` → `notification-service` → `api-gateway`.
3. **CONTRACT congelado.** El front manda el shape. No se inventan IDs ni rutas. SKUs estables: `p-laptop`, `p-mouse`, `p-libro`, `p-silla`.
4. **Humano audita; la IA no firma el dinero.** El motor (`packages/discount-engine` + `discount-service`) se verifica a mano y con tests. El candidato acepta o rechaza cada diff.

Estimación honesta (capa, no un % único):

| Capa | IA | Humano |
| --- | --- | --- |
| Boilerplate Nest/React, DTOs, proxies, k8s YAML | Alta (boilerplate sugerido) | Revisión + ajuste al CONTRACT |
| SDD, runbooks, presentación | Borrador | Decisiones y cifras aprobadas |
| Cascada ×0.9 / ×0.95 / ×0.85 y tope 35 % | Borrador | **Cálculo a mano** y tests de centavos |
| IDs, cupón `WELCOME2026`, 569.29 | Prohibido inventar | Fijos del CONTRACT / SDD §04 |

No hay `AGENTS.md` ni Cursor hooks en este repo. La gobernanza vive en skill + regla + revisión humana + trailers de coautoría.

---

## 2. Skill y regla (artefactos reales)

| Pieza | Ruta | Rol |
| --- | --- | --- |
| Skill | `.cursor/skills/discount-engine-tests/SKILL.md` | Generar/revisar tests del motor: cascada, tope, cupón inválido, carrito vacío. **Stock no va en este package.** |
| Regla | `.cursor/rules/coverage-auditor.mdc` (`alwaysApply: true`) | Auditor de cobertura: ≥ 80 %, sin `any` sin comentario, cascada no suma, preview no muta stock. |
| Bitácora del examen | `docs/ia.md` | Skill, agente, % por capa y correcciones concretas (SDD §13). |

La skill obliga a leer `packages/discount-engine` y `types.ts`. No se inventan porcentajes distintos a categoría 10 % (solo Tecnología), volumen 5 % si S1 > 100, cupón `WELCOME2026` 15 %, cap `payable >= original × 0.65`.

### Tres rechazos concretos a la IA (mínimo de la rúbrica)

1. **No sumar 10+5+15.** Cascada multiplicativa. Ejemplo: 160 → 144 → 136.80 → 116.28 (≈ 27.325 %). El caso dorado de demo es 780.00 → **569.29**.
2. **`WELCOME2026` no dispara el tope del 35 %.** Con las tres tasas fijas el máximo es ≈ 27.3 %. El cap se prueba inyectando un escenario sintético (o un cupón admin tipo `TECH30`), no mintiendo en la UI.
3. **Preview no toca inventario.** `POST /api/v1/checkout/preview` no reserva stock. Solo el confirm (`POST /api/v1/checkout`) entra a la saga.

---

## 3. Protocolo de gobernanza (equipo + agente)

- **Revisión humana de cada PR/commit** que toque dinero, stock o auth. La IA propone; `pipeelyo` firma.
- **El HTML SDD gana** sobre `sdd/services/*.md` y sobre cualquier sugerencia del agente.
- **Árbol compartido compañero + agente.** Un solo monorepo. El front se integró por CONTRACT (copia de carpeta + `packages/shared-contracts`); no se duplica un segundo contrato. Quien implementa schema/SQL (p. ej. vía MCP de Supabase) no inventa tablas que el SDD no nombra.
- **No secretos en git.** Variables en `.env` local y GitHub Secrets / k8s Secret. En el chat y en este README van **nombres** de variables, nunca PAT, `anon key`, `service_role` ni connection strings.
- **No `git push --force` a `main`.** `main` dispara CI/CD (build + coverage + rollout GKE).
- Commits incrementales por HU / servicio, no un dump único.

### Autoría

| Campo | Valor |
| --- | --- |
| Autor Git | Andrés García (`pipeelyo`, `31287790+pipeelyo@users.noreply.github.com`) |
| Trailer Cursor | `Co-authored-by: Cursor <cursoragent@cursor.com>` |
| Trailer Claude | `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` |

`git log` del repo muestra ambos trailers. Eso es la bitácora verificable: la IA co-escribe; la cuenta que empuja a GitHub es la del candidato.

---

## 4. Instalación rápida (reproducir el flujo de IA)

No hay que instalar un “gobernador” aparte. El workflow es Cursor sobre el clone, con Node y el skill/regla del repo.

### Prerrequisitos

- Node.js ≥ 20
- npm (workspaces del `package.json` raíz)
- Git
- [Cursor](https://cursor.com) (para repetir el flujo agente + skill + regla)
- Opcional para demo local completa: Docker / Postgres / Redis, según el runbook del servicio

### Clone y dependencias

```bash
git clone https://github.com/pipeelyo/examen-ecommerce.git
cd examen-ecommerce
npm install
```

Abrir **esta** carpeta como raíz del workspace en Cursor para que carguen `.cursor/skills/` y `.cursor/rules/`.

### Entorno (nombres, no valores)

Copiar cada `.env.example` a `.env` en el servicio que vayas a levantar. Completar valores **fuera de git**.

| Dónde | Variables (nombres) |
| --- | --- |
| `apps/frontend` | `VITE_API_URL`, `VITE_USE_MOCKS` |
| `apps/backend/services/api-gateway` | `PORT`, `INTERNAL_SERVICE_TOKEN`, `ADMIN_API_TOKEN`, `*_SERVICE_URL` |
| `catalog-service` / `coupon-service` / `order-service` | `DATABASE_URL`, `DIRECT_URL`, `INTERNAL_SERVICE_TOKEN` |
| `discount-service` | `PORT`, `INTERNAL_SERVICE_TOKEN` |
| `notification-service` | `REDIS_URL` (si aplica) |

No pegues `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, PAT ni secretos de GitHub en el README, en el chat ni en un commit.

### Levantar (local, mínimo)

```bash
# raíz del monorepo
npm run dev:frontend   # Vite, http://127.0.0.1:5173
```

Front con mocks: `VITE_USE_MOCKS=true` (no necesita los seis micros).  
Front contra API real: `VITE_USE_MOCKS=false` y gateway en `:3000`. Swagger del backend legado: `npm run dev:backend` → `/api/docs`. Micros: `npm run dev:discount`, `npm run dev:catalog`, y el resto según `sdd/README.md`.

Demo pública (ya desplegada): front en `http://35.226.83.92` (nginx reenvía `/api/` y `/api/v1/` al cluster).

---

## 5. Comandos de prueba

Todo desde la **raíz del monorepo**. El umbral de cobertura es ≥ 80 % (CI falla si no). El motor se construye antes de los tests que lo importan.

```bash
npm run build
npm run test:coverage
```

`test:coverage` hace `npm run build -w @examen/discount-engine` y luego `test:coverage` en cada workspace que lo define. Exit code ≠ 0 si algún umbral no se cumple — es lo que se muestra en consola en la defensa.

### Por capa (Vitest)

```bash
# Front (Vitest + Testing Library)
npm test -w @examen/frontend
npm run test:coverage -w @examen/frontend

# Motor compartido
npm test -w @examen/discount-engine

# Tests unitarios de servicios (sin HTTP/DB real en el happy path)
npm test -w discount-service
npm test -w catalog-service
npm test -w coupon-service
npm test -w order-service
npm test -w notification-service
npm test -w api-gateway
```

Backend Nest legado (quotes/orders en memoria): `npm test -w @examen/backend`.

Casos que la skill exige en el motor: carrito vacío, cupón inválido, tech 160 → 116.28, y cap sintético. El caso dorado de CONTRACT está en `packages/shared-contracts` y en tests del gateway (`centsToDollars(56929) === 569.29`).

---

## 6. Verificar catálogo (4 SKUs) y checkout dorado (569.29)

IDs y precios de semilla (`catalog-service` prisma seed / mocks del front):

| id | Nombre | Categoría | Precio | Stock semilla |
| --- | --- | --- | --- | --- |
| `p-laptop` | Laptop | Tecnología | 700 | 10 |
| `p-mouse` | Mouse | Tecnología | 50 | 20 |
| `p-libro` | Libro | Libros | 30 | 15 |
| `p-silla` | Silla | Muebles | 349 | 0 |

Caso dorado: Laptop + Mouse + Libro + `WELCOME2026` → subtotal **780.00**, a pagar **569.29**, tope 35 % **no** aplicado (efectivo ≈ 27 %). Interno: centavos `78000` → `56929`.

Sustituye `$GATEWAY` por `http://127.0.0.1:3000` (local) o por el origen del LoadBalancer (mismo host que el front, path `/api/v1`).

```bash
# Catálogo: 4 productos, ids del CONTRACT
curl -s "$GATEWAY/api/v1/products" | jq '[.[]?.id // .products[]?.id] | unique'

# Cupón oficial
curl -s "$GATEWAY/api/v1/coupons/WELCOME2026" | jq .

# Preview dorado — finalTotal 569.29, cappedAt35 false
curl -s -X POST "$GATEWAY/api/v1/checkout/preview" \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"productId":"p-laptop","quantity":1},{"productId":"p-mouse","quantity":1},{"productId":"p-libro","quantity":1}],"couponCode":"WELCOME2026"}' \
  | jq '{finalTotal, totalDiscount, breakdown}'
```

En UI: una unidad de cada SKU en stock (no la silla), cupón `WELCOME2026`, desglose categoría → volumen → cupón, total **569.29**. Login de demo del CONTRACT usa Bearer `demo` (no es un secreto de infraestructura).

---

## 7. Lo que la IA no debe hacer

- Meter **secretos, PAT, anon keys o PII** en git, en el chat o en este README.
- Exploits, malware, CTF ofensivo, bypass de auth real, keyloggers.
- Inventar product IDs, cupones o tasas fuera de `types.ts` / seed CONTRACT (salvo un test explícito del cap).
- Cambiar DTOs o paths del CONTRACT “porque queda más limpio”.
- Sumar porcentajes o fingir HU4 con `WELCOME2026`.
- Mutar stock en preview.
- `git push --force` a `main`, `--no-verify`, o saltarse coverage.
- Sustituir el SDD HTML por una arquitectura paralela (broker de más, IDs UUID en el borde público, Google Auth en lugar del login demo del CONTRACT).

El candidato sigue siendo el autor responsable. Cursor y Claude son coautores declarados; no firman el motor ni el deploy.
