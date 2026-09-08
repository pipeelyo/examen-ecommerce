import { describe, expect, it } from "vitest";
import { applyAbsoluteCap } from "../../src/apply-absolute-cap";

describe("applyAbsoluteCap", () => {
  it("trunca un descuento bruto sintético del 50% a 35%", () => {
    const capped = applyAbsoluteCap(10000, 5000);
    expect(capped.cappedAt35).toBe(true);
    expect(capped.totalDiscount).toBe(3500);
    expect(capped.finalTotal).toBe(6500);
  });

  it("no trunca si el bruto queda bajo el tope", () => {
    const capped = applyAbsoluteCap(10000, 8000);
    expect(capped.cappedAt35).toBe(false);
    expect(capped.finalTotal).toBe(8000);
  });

  it("carrito vacío no divide por cero", () => {
    const capped = applyAbsoluteCap(0, 0);
    expect(capped.finalTotal).toBe(0);
    expect(capped.cappedAt35).toBe(false);
  });
});
