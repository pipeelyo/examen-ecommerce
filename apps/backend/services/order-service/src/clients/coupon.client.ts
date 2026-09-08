export type ResolvedCoupon = {
  scope: "GLOBAL" | "CATEGORY";
  categoryName?: string;
  discountPercent: number;
};

export type ResolveCouponResult =
  | { applied: true; coupon: ResolvedCoupon }
  | { applied: false; reason: "INVALID_COUPON" | "EXPIRED_COUPON" | "NOT_YET_VALID" };

export interface CouponClient {
  resolve(code: string): Promise<ResolveCouponResult>;
}
