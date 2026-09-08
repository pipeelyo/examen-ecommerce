import { takePercent } from "../money";
import { runningSum } from "../money";
import {
  CATEGORY_PERCENT,
  TECH_CATEGORY,
  type DiscountContext,
  type DiscountStrategy,
  type StrategyOutcome,
} from "./discount-strategy.interface";

export class CategoryDiscountStrategy implements DiscountStrategy {
  readonly name = "CATEGORY" as const;

  isApplicable(ctx: DiscountContext): boolean {
    return ctx.lines.some(
      (line) =>
        line.category === TECH_CATEGORY && line.remainingAmount > 0,
    );
  }

  apply(ctx: DiscountContext): StrategyOutcome {
    if (!this.isApplicable(ctx)) {
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

    const taken = takePercent(
      ctx.lines,
      (line) => line.category === TECH_CATEGORY,
      CATEGORY_PERCENT,
    );
    const runningSubtotal = runningSum(taken.lines);

    return {
      ctx: { ...ctx, lines: taken.lines, runningSubtotal },
      result: {
        name: this.name,
        amount: taken.amount,
        subtotalAfter: runningSubtotal,
        applied: taken.amount > 0,
        reason: taken.amount > 0 ? undefined : "NOT_APPLICABLE",
      },
    };
  }
}
