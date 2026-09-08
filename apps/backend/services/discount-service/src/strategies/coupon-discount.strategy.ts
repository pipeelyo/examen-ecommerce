import { runningSum, takePercent } from "../money";
import {
  type DiscountContext,
  type DiscountStrategy,
  type StrategyOutcome,
} from "./discount-strategy.interface";

export class CouponDiscountStrategy implements DiscountStrategy {
  readonly name = "COUPON" as const;

  isApplicable(ctx: DiscountContext): boolean {
    return Boolean(ctx.resolvedCoupon);
  }

  apply(ctx: DiscountContext): StrategyOutcome {
    const coupon = ctx.resolvedCoupon;
    if (!coupon) {
      return {
        ctx,
        result: {
          name: this.name,
          amount: 0,
          subtotalAfter: ctx.runningSubtotal,
          applied: false,
          reason: "NOT_APPLICABLE",
        },
      };
    }

    const selector =
      coupon.scope === "CATEGORY"
        ? (line: { category: string }) => line.category === coupon.categoryName
        : () => true;

    const taken = takePercent(ctx.lines, selector, coupon.discountPercent);
    const runningSubtotal = runningSum(taken.lines);

    if (taken.amount === 0) {
      return {
        ctx,
        result: {
          name: this.name,
          amount: 0,
          subtotalAfter: ctx.runningSubtotal,
          applied: false,
          reason: "NOT_APPLICABLE",
        },
      };
    }

    return {
      ctx: { ...ctx, lines: taken.lines, runningSubtotal },
      result: {
        name: this.name,
        amount: taken.amount,
        subtotalAfter: runningSubtotal,
        applied: true,
      },
    };
  }
}
