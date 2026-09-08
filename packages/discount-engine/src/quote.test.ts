import { describe, expect, it } from "vitest";
import { applyAbsoluteCap } from "./pipeline";
import { quote } from "./quote";
import type { CartLine } from "./types";

function line(
  overrides: Partial<CartLine> & Pick<CartLine, "unitPrice" | "quantity" | "category">,
): CartLine {
  return {
    productId: overrides.productId ?? "p",
    name: overrides.name ?? "item",
    ...overrides,
  };
}

describe("quote", () => {
  it("sin descuentos si no hay tech, no hay cupón y S0 <= 100", () => {
    const result = quote([line({ unitPrice: 40, quantity: 2, category: "Hogar" })]);
    expect(result.originalSubtotal).toBe(80);
    expect(result.payable).toBe(80);
    expect(result.breakdown.categoryAmount).toBe(0);
    expect(result.breakdown.volumeAmount).toBe(0);
    expect(result.breakdown.couponAmount).toBe(0);
    expect(result.breakdown.capApplied).toBe(false);
  });

  it("cascada 160 tech + cupón: 144 → 136.80 → 116.28 sin tope", () => {
    const result = quote(
      [line({ unitPrice: 80, quantity: 2, category: "Tecnologia" })],
      "WELCOME2026",
    );
    expect(result.originalSubtotal).toBe(160);
    expect(result.breakdown.categoryAmount).toBe(16);
    expect(result.breakdown.volumeAmount).toBe(7.2);
    expect(result.breakdown.couponAmount).toBe(20.52);
    expect(result.payable).toBe(116.28);
    expect(result.breakdown.effectivePercent).toBe(27.33);
    expect(result.breakdown.capApplied).toBe(false);
  });

  it("volumen no aplica si S1 es exactamente 100", () => {
    const result = quote([line({ unitPrice: 100, quantity: 1, category: "Hogar" })]);
    expect(result.breakdown.volumeAmount).toBe(0);
    expect(result.payable).toBe(100);
  });

  it("cupón desconocido no descuenta en el motor", () => {
    const withCoupon = quote(
      [line({ unitPrice: 80, quantity: 1, category: "Hogar" })],
      "NOPE",
    );
    const without = quote([line({ unitPrice: 80, quantity: 1, category: "Hogar" })]);
    expect(withCoupon.payable).toBe(without.payable);
    expect(withCoupon.breakdown.couponAmount).toBe(0);
  });

  it("carrito vacío", () => {
    const result = quote([]);
    expect(result).toEqual({
      originalSubtotal: 0,
      payable: 0,
      breakdown: {
        categoryAmount: 0,
        volumeAmount: 0,
        couponAmount: 0,
        totalAmount: 0,
        effectivePercent: 0,
        capApplied: false,
      },
    });
  });

  it("10% solo sobre líneas Tecnología", () => {
    const result = quote([
      line({ productId: "t", unitPrice: 50, quantity: 1, category: "Tecnologia" }),
      line({ productId: "h", unitPrice: 50, quantity: 1, category: "Hogar" }),
    ]);
    expect(result.breakdown.categoryAmount).toBe(5);
    expect(result.payable).toBe(95);
  });
});

describe("applyAbsoluteCap", () => {
  it("trunca a 35% si el cascade pide más", () => {
    const capped = applyAbsoluteCap(100, 50);
    expect(capped.payable).toBe(65);
    expect(capped.capApplied).toBe(true);
  });

  it("no aplica si el descuento queda bajo el tope", () => {
    const capped = applyAbsoluteCap(100, 80);
    expect(capped.payable).toBe(80);
    expect(capped.capApplied).toBe(false);
  });
});
