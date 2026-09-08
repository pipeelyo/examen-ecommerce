import { applyAbsoluteCap, defaultPipeline, money } from "./pipeline";
import type { CartLine, Quote } from "./types";

export function quote(lines: CartLine[], couponCode?: string | null): Quote {
  const originalSubtotal = money(
    lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
  );

  if (originalSubtotal === 0) {
    return {
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
    };
  }

  const cascaded = defaultPipeline.run({
    lines,
    originalSubtotal,
    current: originalSubtotal,
    couponCode: couponCode?.trim() || null,
    categoryAmount: 0,
    volumeAmount: 0,
    couponAmount: 0,
  });

  const capped = applyAbsoluteCap(originalSubtotal, cascaded.current);
  const totalAmount = money(originalSubtotal - capped.payable);

  return {
    originalSubtotal,
    payable: capped.payable,
    breakdown: {
      categoryAmount: cascaded.categoryAmount,
      volumeAmount: cascaded.volumeAmount,
      couponAmount: cascaded.couponAmount,
      totalAmount,
      effectivePercent: money((totalAmount / originalSubtotal) * 100),
      capApplied: capped.capApplied,
    },
  };
}
