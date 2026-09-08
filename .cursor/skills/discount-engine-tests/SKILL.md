---
name: discount-engine-tests
description: >-
  Generates and reviews unit tests for the cumulative discount engine
  (category 10% on Tecnologia, volume 5% after $100, coupon WELCOME2026 15%,
  absolute cap 35%). Use when adding tests under packages/discount-engine,
  Vitest coverage, quote/checkout math, or edge cases for empty cart and
  invalid coupons.
---

# Tests del motor de descuentos

## Reglas (no negociables)

- Cascada **multiplicativa**, nunca sumar 10+5+15.
- Categoría 10% **solo** líneas `Tecnologia`.
- Volumen 5% si y solo si el subtotal **después** de categoría es **> 100** (100 exacto no aplica).
- Cupón válido solo `WELCOME2026` (case a definir en implementación; tests cubren inválido).
- Cap: `payable >= original * 0.65`. Si el cascade pide más descuento, truncar y `capApplied: true`.
- Este package **no** decrementa stock.

## Casos mínimos

1. Solo no-tech, sin cupón, S0 ≤ 100 → sin descuentos.
2. Tech $160 → 144 → 136.80 → con cupón 116.28; efectivo ≈ 27.325%; `capApplied: false`.
3. Cupón basura → mismo payable que sin cupón, error en API no en el engine puro (el engine recibe `couponOk: boolean`).
4. Carrito vacío → original 0, payable 0.
5. Forzar cap con un step de prueba o subtotal sintético que exceda 35%.

## Salida

Vitest. Sin `any`. Nombres de test en español o inglés, consistentes. No mocks del pipeline interno: ejercitar la función pública `quote(lines, coupon)`.
