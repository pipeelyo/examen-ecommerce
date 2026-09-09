import { describe, expect, it } from "vitest";
import { centsToDollars, convertBreakdownToDollars, type CheckoutBreakdownCents } from "../../src/common/money";

describe("centsToDollars", () => {
  it("convierte centavos enteros a dolares con 2 decimales", () => {
    expect(centsToDollars(56929)).toBe(569.29);
  });

  it("redondea antes de dividir para evitar arrastrar floats", () => {
    expect(centsToDollars(100.4)).toBe(1);
  });

  it("cero centavos es cero dolares", () => {
    expect(centsToDollars(0)).toBe(0);
  });
});

describe("convertBreakdownToDollars", () => {
  const CENTS: CheckoutBreakdownCents = {
    originalSubtotal: 78000,
    breakdown: {
      category: { applied: true, amount: 7500 },
      volume: { applied: true, amount: 3525 },
      coupon: { applied: true, amount: 10046 },
      cappedAt35: false,
    },
    totalDiscount: 21071,
    effectiveDiscountPercentage: 27.02,
    finalTotal: 56929,
  };

  it("caso dorado del CONTRACT: 780/569.29 tras convertir", () => {
    const result = convertBreakdownToDollars(CENTS);
    expect(result.originalSubtotal).toBe(780);
    expect(result.finalTotal).toBe(569.29);
    expect(result.totalDiscount).toBe(210.71);
  });

  it("convierte cada linea del desglose (category/volume/coupon) sin tocar applied/reason", () => {
    const result = convertBreakdownToDollars(CENTS);
    expect(result.breakdown.category).toEqual({ applied: true, amount: 75 });
    expect(result.breakdown.volume).toEqual({ applied: true, amount: 35.25 });
    expect(result.breakdown.coupon).toEqual({ applied: true, amount: 100.46 });
  });

  it("no toca effectiveDiscountPercentage ni cappedAt35 (no son montos en centavos)", () => {
    const result = convertBreakdownToDollars(CENTS);
    expect(result.effectiveDiscountPercentage).toBe(27.02);
    expect(result.breakdown.cappedAt35).toBe(false);
  });

  it("preserva campos extra del objeto original (p.ej. orderId, status, createdAt)", () => {
    const extended = { ...CENTS, orderId: "order-1", status: "CONFIRMED" as const };
    const result = convertBreakdownToDollars(extended);
    expect(result.orderId).toBe("order-1");
    expect(result.status).toBe("CONFIRMED");
  });
});
