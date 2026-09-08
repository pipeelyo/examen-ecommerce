# Arquitectura

Respuestas exigidas por la prueba. Detalle en [sdd.md](sdd.md).

## ¿Por qué este stack y este diseño de carpetas?

Monorepo `examen-ecommerce` tal como pide el enunciado.

- **React + Vite + TypeScript** en `apps/frontend`: UI de carrito en minutos, tipado, tests con Vitest.
- **NestJS + TypeScript** en `apps/backend`: módulos, Swagger, un controlador delgado.
- **`packages/discount-engine`**: las reglas de dinero viven fuera de HTTP y de la base en memoria. Front y back importan los mismos tipos; **solo el backend ejecuta el pipeline oficial**.

Carpetas = límites de responsabilidad, no un framework impuesto.

## Trade-offs

| Decisión | A favor | En contra |
| --- | --- | --- |
| Persistencia en memoria | Demo local, cero infra | Se pierde al reiniciar |
| Preview `POST /api/quotes` además de checkout | UI de desglose sin quemar stock | Un endpoint extra |
| GKE Autopilot sin Redis/RabbitMQ | Menos costo y menos superficie que Kata E1 | No hay cache ni colas en este MVP |
| 1 réplica por Deployment | Cabe en la demo y baja la factura | Menos HA que las 2 réplicas de Kata E1 |
| Tope 35% aunque las 3 tasas no lo alcancen solas | Cumple la gobernanza de margen | HU4 en demo requiere un caso de test o explicar el máximo ~27.3% |

Elegimos **simplicidad de entrega** sobre extensibilidad de catálogo. El Adapter de store deja la puerta a SQLite sin tocar el motor.

## Cómo se aísla el motor

```
HTTP controller → application service (stock + persistencia)
                      ↓
              DiscountPipeline (package)
                      ↓
              Strategy steps: categoria, volumen, cupon
                      ↓
              AbsoluteCap
```

El package no importa Nest ni React. Los tests del 80% crítico van primero ahí.

## Patrones en código

1. **Strategy** — cada descuento es un paso intercambiable.
2. **Pipeline / Chain** — orden fijo 1→2→3 + cap.
3. **Adapter** — `OrderStore` / `Catalog` en memoria; el servicio de aplicación depende de interfaces.

(El front usará un store observable para el carrito: Observer.)
