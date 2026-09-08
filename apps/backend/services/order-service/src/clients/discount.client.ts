import type { ResolvedCoupon } from "./coupon.client";

export type CalculateLine = {
  productId: string;
  category: string;
  originalAmount: number;
};

export type CalculateInput = {
  originalSubtotal?: number;
  lines: CalculateLine[];
  resolvedCoupon?: ResolvedCoupon;
};

export type DiscountLine = {
  applied: boolean;
  amount: number;
  reason?: string;
};

export type CheckoutBreakdown = {
  originalSubtotal: number;
  breakdown: {
    category: DiscountLine;
    volume: DiscountLine;
    coupon: DiscountLine;
    cappedAt35: boolean;
  };
  totalDiscount: number;
  effectiveDiscountPercentage: number;
  finalTotal: number;
};

export interface DiscountClient {
  calculate(input: CalculateInput): Promise<CheckoutBreakdown>;
}
