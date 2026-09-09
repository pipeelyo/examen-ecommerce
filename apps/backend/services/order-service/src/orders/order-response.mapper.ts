import type { CheckoutBreakdown } from "../clients/discount.client";
import type { PersistedOrder } from "./orders.repository";

export interface OrderContractCents {
  orderId: string;
  status: string;
  createdAt: Date;
  originalSubtotal: number;
  breakdown: CheckoutBreakdown["breakdown"];
  totalDiscount: number;
  effectiveDiscountPercentage: number;
  finalTotal: number;
}

export interface PersistedOrderRow {
  id: string;
  status: string;
  createdAt: Date;
  originalSubtotal: number;
  categoryDiscountAmount: number;
  volumeDiscountAmount: number;
  couponDiscountAmount: number;
  discountCapped: boolean;
  finalTotal: number;
}

function discountLine(amount: number): { applied: boolean; amount: number } {
  return { applied: amount > 0, amount };
}

function effectiveDiscountPercentage(originalSubtotal: number, totalDiscount: number): number {
  if (originalSubtotal === 0) return 0;
  return Math.round((totalDiscount / originalSubtotal) * 10000) / 100;
}

export function toOrderContractFromCheckout(
  order: PersistedOrder,
  breakdown: CheckoutBreakdown,
): OrderContractCents {
  return {
    orderId: order.id,
    status: order.status,
    createdAt: order.createdAt,
    ...breakdown,
  };
}

export function toOrderContractFromPersisted(order: PersistedOrderRow): OrderContractCents {
  const originalSubtotal = Number(order.originalSubtotal);
  const finalTotal = Number(order.finalTotal);
  const totalDiscount = originalSubtotal - finalTotal;
  return {
    orderId: order.id,
    status: order.status,
    createdAt: order.createdAt,
    originalSubtotal,
    breakdown: {
      category: discountLine(Number(order.categoryDiscountAmount)),
      volume: discountLine(Number(order.volumeDiscountAmount)),
      coupon: discountLine(Number(order.couponDiscountAmount)),
      cappedAt35: order.discountCapped,
    },
    totalDiscount,
    effectiveDiscountPercentage: effectiveDiscountPercentage(originalSubtotal, totalDiscount),
    finalTotal,
  };
}
