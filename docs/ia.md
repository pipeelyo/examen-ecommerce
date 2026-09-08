# Gobernanza de IA

Uso de Cursor en este monorepo. El candidato audita; la IA no firma el motor de descuentos.

## 1. Skill / prompt automatizado

Skill de proyecto: `.cursor/skills/discount-engine-tests/SKILL.md`.

Sirve para generar o completar **pruebas unitarias del motor** (cascade, tope 35%, cupón inválido, carrito vacío, stock no va en este package). El agente debe leer `packages/discount-engine` y no inventar porcentajes distintos a `types.ts`.

## 2. Agente / regla

Regla Cursor: `.cursor/rules/coverage-auditor.mdc` (`alwaysApply: true` en este repo).

Rol: **auditor de cobertura**. Exige ≥ 80% en `packages/discount-engine` y en el estado del carrito / alerta del 35% en frontend. Prohíbe `any` sin comentario. Prohíbe sumar 10+5+15 en lugar de cascade.

## 3. Bitácora de co-creación

### Qué hace la IA vs el desarrollador

| Pieza | IA | Humano |
| --- | --- | --- |
| Estructura monorepo, SDD, tipos | Sugerida y revisada | Aprobada |
| Fórmulas del pipeline (×0.9 líneas tech, ×0.95 si S1>100, ×0.85 cupón, cap 35%) | Borrador | **Cálculo verificado a mano** (ejemplo S0=160 → 27.325%) |
| Implementación Nest/React | Siguiente iteración | Tests de borde antes de aceptar el código |

Porcentaje estimado en este incremento (docs + esqueleto): ~70% texto/estructura IA, 100% de las constantes y el contraejemplo del 35% revisados por el desarrollador.

### Correcciones a la IA (mínimo dos; la segunda se cerrará al implementar)

1. **Rechazo: sumar porcentajes.** Una IA suele hacer 10%+5%+15% = 30%. El enunciado pide **cascada multiplicativa**. Queda prohibido en la skill y en la regla. Ejemplo correcto: 160 → 144 → 136.80 → 116.28.
2. **Rechazo: asumir que WELCOME2026 dispara el tope del 35%.** Con las tasas del enunciado el máximo es ≈27.3% si todo es Tecnología. El cap se implementa igual; HU4 no se finge en la UI con el cupón oficial. Tests del cap usan un escenario construido, no un número mágico en el front.

3. **Rechazo: mutar stock en `POST /api/quotes`.** El preview no toca inventario. Solo `POST /api/orders` decrementa y persiste. Cubierto en tests del backend.
