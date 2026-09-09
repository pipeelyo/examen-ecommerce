export interface DiscountLineAmount {
  applied: boolean;
  amount: number;
  reason?: string;
}

export interface CheckoutBreakdownCents {
  originalSubtotal: number;
  breakdown: {
    category: DiscountLineAmount;
    volume: DiscountLineAmount;
    coupon: DiscountLineAmount;
    cappedAt35: boolean;
  };
  totalDiscount: number;
  effectiveDiscountPercentage: number;
  finalTotal: number;
}

export function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

/**
 * El motor de descuentos trabaja 100% en centavos enteros (evita floats en
 * dinero en toda la cadena interna); esta es la unica conversion a dolares,
 * en el unico borde que habla con el CONTRACT.md del front.
 */
export function convertBreakdownToDollars<T extends CheckoutBreakdownCents>(breakdown: T): T {
  return {
    ...breakdown,
    originalSubtotal: centsToDollars(breakdown.originalSubtotal),
    totalDiscount: centsToDollars(breakdown.totalDiscount),
    finalTotal: centsToDollars(breakdown.finalTotal),
    breakdown: {
      ...breakdown.breakdown,
      category: { ...breakdown.breakdown.category, amount: centsToDollars(breakdown.breakdown.category.amount) },
      volume: { ...breakdown.breakdown.volume, amount: centsToDollars(breakdown.breakdown.volume.amount) },
      coupon: { ...breakdown.breakdown.coupon, amount: centsToDollars(breakdown.breakdown.coupon.amount) },
    },
  };
}
