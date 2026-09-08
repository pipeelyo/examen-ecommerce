import { describe, expect, it } from "vitest";
import { CouponDiscountStrategy } from "../../src/strategies/coupon-discount.strategy";
import type { DiscountContext } from "../../src/strategies/discount-strategy.interface";

const lines = [
  {
    productId: "laptop",
    category: "Tecnologia",
    originalAmount: 10000,
    remainingAmount: 10000,
  },
  {
    productId: "silla",
    category: "Hogar",
    originalAmount: 10000,
    remainingAmount: 10000,
  },
];

describe("CouponDiscountStrategy", () => {
  const strategy = new CouponDiscountStrategy();

  it("GLOBAL descuenta todas las líneas", () => {
    const ctx: DiscountContext = {
      originalSubtotal: 20000,
      lines,
      runningSubtotal: 20000,
      resolvedCoupon: { scope: "GLOBAL", discountPercent: 15 },
    };
    const outcome = strategy.apply(ctx);
    expect(outcome.result.applied).toBe(true);
    expect(outcome.result.amount).toBe(3000);
    expect(outcome.ctx.runningSubtotal).toBe(17000);
  });

  it("CATEGORY no toca otras categorías", () => {
    const ctx: DiscountContext = {
      originalSubtotal: 20000,
      lines,
      runningSubtotal: 20000,
      resolvedCoupon: {
        scope: "CATEGORY",
        categoryName: "Tecnologia",
        discountPercent: 30,
      },
    };
    const outcome = strategy.apply(ctx);
    expect(outcome.result.amount).toBe(3000);
    expect(outcome.ctx.lines[0].remainingAmount).toBe(7000);
    expect(outcome.ctx.lines[1].remainingAmount).toBe(10000);
  });

  it("sin cupón resuelto no aplica", () => {
    const ctx: DiscountContext = {
      originalSubtotal: 20000,
      lines,
      runningSubtotal: 20000,
    };
    expect(strategy.isApplicable(ctx)).toBe(false);
    expect(strategy.apply(ctx).result.reason).toBe("NOT_APPLICABLE");
  });

  it("CATEGORY sin líneas de esa categoría no aplica", () => {
    const ctx: DiscountContext = {
      originalSubtotal: 20000,
      lines,
      runningSubtotal: 20000,
      resolvedCoupon: {
        scope: "CATEGORY",
        categoryName: "Jugueteria",
        discountPercent: 10,
      },
    };
    const outcome = strategy.apply(ctx);
    expect(outcome.result.applied).toBe(false);
    expect(outcome.result.reason).toBe("NOT_APPLICABLE");
  });
});
