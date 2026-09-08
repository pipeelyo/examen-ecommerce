import { describe, expect, it } from "vitest";
import { VolumeDiscountStrategy } from "../../src/strategies/volume-discount.strategy";
import type { DiscountContext } from "../../src/strategies/discount-strategy.interface";

function ctx(running: number): DiscountContext {
  return {
    originalSubtotal: running,
    runningSubtotal: running,
    lines: [
      {
        productId: "a",
        category: "Hogar",
        originalAmount: running,
        remainingAmount: running,
      },
    ],
  };
}

describe("VolumeDiscountStrategy", () => {
  const strategy = new VolumeDiscountStrategy();

  it("no aplica en exactamente $100.00", () => {
    const before = ctx(10000);
    expect(strategy.isApplicable(before)).toBe(false);
    expect(strategy.apply(before).result.applied).toBe(false);
  });

  it("aplica en $100.01", () => {
    const outcome = strategy.apply(ctx(10001));
    expect(outcome.result.applied).toBe(true);
    expect(outcome.result.amount).toBe(Math.round(10001 * 0.05));
  });
});
