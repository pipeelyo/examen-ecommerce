export type DiscountName = "CATEGORY" | "VOLUME" | "COUPON";

export type DiscountReason =
  | "NOT_APPLICABLE"
  | "INVALID_COUPON"
  | "EXPIRED_COUPON"
  | "NOT_YET_VALID";

export interface CartLineState {
  productId: string;
  category: string;
  originalAmount: number;
  remainingAmount: number;
}

export interface ResolvedCoupon {
  scope: "GLOBAL" | "CATEGORY";
  categoryName?: string;
  discountPercent: number;
}

export interface DiscountContext {
  readonly originalSubtotal: number;
  readonly lines: ReadonlyArray<CartLineState>;
  readonly runningSubtotal: number;
  readonly resolvedCoupon?: ResolvedCoupon;
}

export interface DiscountResult {
  readonly name: DiscountName;
  readonly amount: number;
  readonly subtotalAfter: number;
  readonly applied: boolean;
  readonly reason?: DiscountReason;
}

export interface StrategyOutcome {
  readonly result: DiscountResult;
  readonly ctx: DiscountContext;
}

export interface DiscountStrategy {
  readonly name: DiscountName;
  isApplicable(ctx: DiscountContext): boolean;
  apply(ctx: DiscountContext): StrategyOutcome;
}

export const TECH_CATEGORY = "Tecnologia";
export const CATEGORY_PERCENT = 10;
export const VOLUME_PERCENT = 5;
export const VOLUME_THRESHOLD_CENTS = 10000;
export const ABSOLUTE_CAP_RATE = 0.35;
