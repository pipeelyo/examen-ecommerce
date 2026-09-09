import { describe, expect, it } from "vitest";
import type { CheckoutBreakdown } from "../../src/clients/discount.client";
import {
  toOrderContractFromCheckout,
  toOrderContractFromPersisted,
} from "../../src/orders/order-response.mapper";

const BREAKDOWN: CheckoutBreakdown = {
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

describe("toOrderContractFromCheckout", () => {
  it("expone orderId (no id) y el breakdown en centavos", () => {
    const createdAt = new Date("2026-06-15T12:00:00.000Z");
    const result = toOrderContractFromCheckout(
      { id: "order-1", status: "CONFIRMED", finalTotal: 56929, createdAt },
      BREAKDOWN,
    );

    expect(result.orderId).toBe("order-1");
    expect(result).not.toHaveProperty("id");
    expect(result.status).toBe("CONFIRMED");
    expect(result.createdAt).toBe(createdAt);
    expect(result.finalTotal).toBe(56929);
    expect(result.breakdown.coupon.amount).toBe(10046);
  });
});

describe("toOrderContractFromPersisted", () => {
  it("reconstruye el CONTRACT en centavos desde columnas persistidas (caso dorado)", () => {
    const createdAt = new Date("2026-06-15T12:00:00.000Z");
    const result = toOrderContractFromPersisted({
      id: "order-1",
      status: "CONFIRMED",
      createdAt,
      originalSubtotal: 78000,
      categoryDiscountAmount: 7500,
      volumeDiscountAmount: 3525,
      couponDiscountAmount: 10046,
      discountCapped: false,
      finalTotal: 56929,
    });

    expect(result).toEqual({
      orderId: "order-1",
      status: "CONFIRMED",
      createdAt,
      originalSubtotal: 78000,
      breakdown: {
        category: { applied: true, amount: 7500 },
        volume: { applied: true, amount: 3525 },
        coupon: { applied: true, amount: 10046 },
        cappedAt35: false,
      },
      totalDiscount: 21071,
      effectiveDiscountPercentage: 27.01,
      finalTotal: 56929,
    });
  });

  it("marca applied=false cuando la linea vale 0 y percentage 0 si el subtotal es 0", () => {
    const result = toOrderContractFromPersisted({
      id: "order-empty",
      status: "CONFIRMED",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      originalSubtotal: 0,
      categoryDiscountAmount: 0,
      volumeDiscountAmount: 0,
      couponDiscountAmount: 0,
      discountCapped: false,
      finalTotal: 0,
    });

    expect(result.breakdown.category).toEqual({ applied: false, amount: 0 });
    expect(result.effectiveDiscountPercentage).toBe(0);
    expect(result.totalDiscount).toBe(0);
  });
});
