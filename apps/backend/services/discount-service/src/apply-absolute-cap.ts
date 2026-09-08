import { ABSOLUTE_CAP_RATE } from "./strategies/discount-strategy.interface";

export function applyAbsoluteCap(
  originalSubtotal: number,
  runningSubtotal: number,
): { finalTotal: number; totalDiscount: number; cappedAt35: boolean } {
  if (originalSubtotal <= 0) {
    return { finalTotal: 0, totalDiscount: 0, cappedAt35: false };
  }

  const maxDiscount = Math.round(originalSubtotal * ABSOLUTE_CAP_RATE);
  const gross = originalSubtotal - runningSubtotal;

  if (gross > maxDiscount) {
    return {
      finalTotal: originalSubtotal - maxDiscount,
      totalDiscount: maxDiscount,
      cappedAt35: true,
    };
  }

  return {
    finalTotal: runningSubtotal,
    totalDiscount: gross,
    cappedAt35: false,
  };
}
