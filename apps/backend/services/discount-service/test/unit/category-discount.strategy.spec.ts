import { describe, expect, it } from "vitest";
import { CategoryDiscountStrategy } from "../../src/strategies/category-discount.strategy";
import type { DiscountContext } from "../../src/strategies/discount-strategy.interface";

function ctx(lines: DiscountContext["lines"]): DiscountContext {
  return {
    originalSubtotal: lines.reduce((sum, line) => sum + line.originalAmount, 0),
    lines,
    runningSubtotal: lines.reduce((sum, line) => sum + line.remainingAmount, 0),
  };
}

describe("CategoryDiscountStrategy", () => {
  const strategy = new CategoryDiscountStrategy();

  it("aplica 10% solo a líneas Tecnología", () => {
    const outcome = strategy.apply(
      ctx([
        {
          productId: "laptop",
          category: "Tecnologia",
          originalAmount: 70000,
          remainingAmount: 70000,
        },
        {
          productId: "libro",
          category: "Libros",
          originalAmount: 3000,
          remainingAmount: 3000,
        },
      ]),
    );
    expect(outcome.result.applied).toBe(true);
    expect(outcome.result.amount).toBe(7000);
    expect(outcome.ctx.lines[0].remainingAmount).toBe(63000);
    expect(outcome.ctx.lines[1].remainingAmount).toBe(3000);
  });

  it("no aplica si las líneas tech ya están en cero", () => {
    const outcome = strategy.apply(
      ctx([
        {
          productId: "laptop",
          category: "Tecnologia",
          originalAmount: 100,
          remainingAmount: 0,
        },
      ]),
    );
    expect(outcome.result.applied).toBe(false);
  });

  it("no aplica si no hay Tecnología", () => {
    const before = ctx([
      {
        productId: "libro",
        category: "Libros",
        originalAmount: 3000,
        remainingAmount: 3000,
      },
    ]);
    expect(strategy.isApplicable(before)).toBe(false);
    const outcome = strategy.apply(before);
    expect(outcome.result.applied).toBe(false);
    expect(outcome.result.reason).toBe("NOT_APPLICABLE");
    expect(outcome.ctx.lines[0].remainingAmount).toBe(3000);
  });
});
