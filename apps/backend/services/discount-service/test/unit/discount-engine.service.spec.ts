import { describe, expect, it } from "vitest";
import { DiscountEngineService } from "../../src/discount-engine.service";
import { DiscountStrategyFactory } from "../../src/factories/discount-strategy.factory";

describe("DiscountEngineService", () => {
  const engine = new DiscountEngineService();

  it("ejemplo SDD §04: $780 → 56929 centavos", () => {
    const result = engine.calculate({
      lines: [
        {
          productId: "laptop",
          category: "Tecnologia",
          originalAmount: 70000,
        },
        {
          productId: "mouse",
          category: "Tecnologia",
          originalAmount: 5000,
        },
        {
          productId: "libro",
          category: "Libros",
          originalAmount: 3000,
        },
      ],
      resolvedCoupon: { scope: "GLOBAL", discountPercent: 15 },
    });

    expect(result.originalSubtotal).toBe(78000);
    expect(result.breakdown.category.amount).toBe(7500);
    expect(result.breakdown.volume.amount).toBe(3525);
    expect(result.breakdown.coupon.amount).toBe(10046);
    expect(result.finalTotal).toBe(56929);
    expect(result.breakdown.cappedAt35).toBe(false);
  });

  it("TECH30 sobre carrito 100% Tecnología activa el tope 35%", () => {
    const result = engine.calculate({
      lines: [
        {
          productId: "laptop",
          category: "Tecnologia",
          originalAmount: 70000,
        },
        {
          productId: "phone",
          category: "Tecnologia",
          originalAmount: 50000,
        },
      ],
      resolvedCoupon: {
        scope: "CATEGORY",
        categoryName: "Tecnologia",
        discountPercent: 30,
      },
    });

    expect(result.originalSubtotal).toBe(120000);
    expect(result.breakdown.cappedAt35).toBe(true);
    expect(result.finalTotal).toBe(78000);
  });

  it("carrito vacío", () => {
    const result = engine.calculate({ lines: [] });
    expect(result.originalSubtotal).toBe(0);
    expect(result.finalTotal).toBe(0);
    expect(result.effectiveDiscountPercentage).toBe(0);
  });

  it("el factory arma categoría → volumen → cupón", () => {
    const names = new DiscountStrategyFactory()
      .buildPipeline()
      .map((step) => step.name);
    expect(names).toEqual(["CATEGORY", "VOLUME", "COUPON"]);
  });
});
