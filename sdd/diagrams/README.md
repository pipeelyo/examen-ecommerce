# Diagramas de arquitectura (Draw.io)

Fuente de verdad: `sdd-core-ecommerce.html`. Los `.drawio` traducen **todas** las figuras mermaid del SDD y los flujos de arquitectura numerados (C4, gateway, preview vs confirm, auth, schemas, GKE). Cada archivo incluye un recuadro **Por qué / decisión**.

No se inventan IDs de producto ni se altera el contrato de examen. No hay secretos.

## Cómo abrir

1. [diagrams.net](https://app.diagrams.net/) → *Open* → elegir el `.drawio`
2. Extensión **Draw.io Integration** en VS Code / Cursor → abrir el archivo
3. Exportar PNG/SVG desde diagrams.net (*File → Export*) para la sustentación

Paleta alineada al SDD: azul `#2E5EAA`, naranja decisión `#C1652E`, verde OK `#2F8F5B`.

## Índice

| Archivo | Sección SDD | Decisión clave |
|---|---|---|
| `01-c4-contexto.drawio` | §01 Resumen | Dos niveles MVP vs Enterprise; stack cerrado React + NestJS + Supabase |
| `02-contenedores-microservicios.drawio` | §03 Fig. 1 | 6 procesos NestJS; gateway único público; motor sin DB |
| `03-gateway-api-publica.drawio` | §07 | Internos ClusterIP + `X-Internal-Token`; centavos internos / dólares en contrato |
| `04-checkout-preview-vs-confirm.drawio` | §02 HU2/HU3, §05 | Preview no pasa por `order-service`; mismo motor; SSE desacoplado del 201 |
| `05-motor-descuentos.drawio` | §04 Fig. 2 | Cascada multiplicativa; tope 35% al final; Strategy+Factory; centavos |
| `06-secuencia-checkout.drawio` | §05 Fig. 3 | Cliente no espera SSE; 409 si no hay stock |
| `07-secuencia-stock.drawio` | §09 | Único paso compensable: `release` si falla la persistencia |
| `08-secuencia-cupones.drawio` | §04 | Vigencia = dos fechas en `coupon-service`, no en el motor |
| `09-saga-orquestacion.drawio` | §09 Fig. 5 | Orquestación (no coreografía) porque el flujo es lineal de 4 pasos |
| `10-estados-orden.drawio` | §09 Fig. 6 | Compensación post-confirmada = pasarela futura; outbox ≠ event store completo |
| `11-modelo-er.drawio` | §06 Fig. 4 | Snapshots en `order_items`; JWE en `guest_info_enc`; carrito MVP = Zustand |
| `12-bounded-contexts-schemas.drawio` | §06 | Una instancia, schema por servicio; sin JOIN cruzado |
| `13-auth-identidad.drawio` | §08 + servicios 07/08 | Demo Bearer vs JWT Supabase en paralelo; JWE solo invitado; sociales = Enterprise |
| `14-circuit-breaker.drawio` | §10 Fig. 7 | Circuito entre micros; Redis publish no bloquea el 201; Redis ≠ PgBouncer |
| `15-despliegue-gke.drawio` | §11 Fig. 8 | ClusterIP en micros; LoadBalancer solo frontend; 1 réplica costo vs HPA diseño |
| `16-outbox-eventos.drawio` | §09 | Redis en vez de RabbitMQ; `EventPublisher` deja la costura |
| `17-mvp-vs-enterprise.drawio` | §01 | No levantar K8s para 20 min; interfaces ya en el MVP |
| `18-auditoria-hmac.drawio` | §06 | Ofuscación ≠ seguridad; HMAC + GRANT `role_admin` |

## Figuras mermaid del HTML cubiertas

| Fig. SDD | Archivo |
|---|---|
| Fig. 1 contenedores | `02-contenedores-microservicios.drawio` |
| Fig. 2 cascada descuentos | `05-motor-descuentos.drawio` |
| Fig. 3 secuencia checkout | `06-secuencia-checkout.drawio` |
| Fig. 4 ER | `11-modelo-er.drawio` |
| Fig. 5 saga | `09-saga-orquestacion.drawio` |
| Fig. 6 estados | `10-estados-orden.drawio` |
| Fig. 7 circuit breaker | `14-circuit-breaker.drawio` |
| Fig. 8 GKE | `15-despliegue-gke.drawio` |
