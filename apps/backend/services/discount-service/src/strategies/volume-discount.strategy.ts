import { runningSum, takePercent } from "../money";
import {
  VOLUME_PERCENT,
  VOLUME_THRESHOLD_CENTS,
  type DiscountContext,
  type DiscountStrategy,
  type StrategyOutcome,
} from "./discount-strategy.interface";

export class VolumeDiscountStrategy implements DiscountStrategy {
  readonly name = "VOLUME" as const;

  isApplicable(ctx: DiscountContext): boolean {
    return ctx.runningSubtotal > VOLUME_THRESHOLD_CENTS;
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

    const taken = takePercent(ctx.lines, () => true, VOLUME_PERCENT);
    const runningSubtotal = runningSum(taken.lines);

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
