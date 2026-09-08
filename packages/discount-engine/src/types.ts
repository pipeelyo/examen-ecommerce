export type Category = "Tecnologia" | "Hogar" | "Ropa" | "Otros";

export type CartLine = {
  productId: string;
  name: string;
  unitPrice: number;
  category: Category;
  quantity: number;
};

export type DiscountBreakdown = {
  categoryAmount: number;
  volumeAmount: number;
  couponAmount: number;
  totalAmount: number;
  effectivePercent: number;
  capApplied: boolean;
};

export type Quote = {
  originalSubtotal: number;
  breakdown: DiscountBreakdown;
  payable: number;
};

export const VOLUME_THRESHOLD_USD = 100;
export const CATEGORY_RATE = 0.1;
export const VOLUME_RATE = 0.05;
export const COUPON_RATE = 0.15;
export const ABSOLUTE_CAP_RATE = 0.35;
export const ACTIVE_COUPON = "WELCOME2026";
