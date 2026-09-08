import {
  ABSOLUTE_CAP_RATE,
  ACTIVE_COUPON,
  CATEGORY_RATE,
  COUPON_RATE,
  VOLUME_RATE,
  VOLUME_THRESHOLD_USD,
  type CartLine,
} from "./types";

export function money(n: number): number {
  return Math.round(n * 100) / 100;
}

export type DiscountContext = {
  lines: CartLine[];
  originalSubtotal: number;
  current: number;
  couponCode: string | null;
  categoryAmount: number;
  volumeAmount: number;
  couponAmount: number;
};

export interface DiscountStep {
  name: string;
  apply(ctx: DiscountContext): DiscountContext;
}

export const categoryStep: DiscountStep = {
  name: "category",
  apply(ctx) {
    const tech = ctx.lines
      .filter((line) => line.category === "Tecnologia")
      .reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    const categoryAmount = money(tech * CATEGORY_RATE);
    return {
      ...ctx,
      categoryAmount,
      current: money(ctx.current - categoryAmount),
    };
  },
};

export const volumeStep: DiscountStep = {
  name: "volume",
  apply(ctx) {
    if (ctx.current <= VOLUME_THRESHOLD_USD) {
      return { ...ctx, volumeAmount: 0 };
    }
    const next = money(ctx.current * (1 - VOLUME_RATE));
    return { ...ctx, volumeAmount: money(ctx.current - next), current: next };
  },
};

export const couponStep: DiscountStep = {
  name: "coupon",
  apply(ctx) {
    if (ctx.couponCode !== ACTIVE_COUPON) {
      return { ...ctx, couponAmount: 0 };
    }
    const next = money(ctx.current * (1 - COUPON_RATE));
    return { ...ctx, couponAmount: money(ctx.current - next), current: next };
  },
};

export class DiscountPipeline {
  constructor(private readonly steps: DiscountStep[]) {}

  run(ctx: DiscountContext): DiscountContext {
    return this.steps.reduce((current, step) => step.apply(current), ctx);
  }
}

export const defaultPipeline = new DiscountPipeline([
  categoryStep,
  volumeStep,
  couponStep,
]);

export function applyAbsoluteCap(
  originalSubtotal: number,
  payable: number,
): { payable: number; capApplied: boolean } {
  if (originalSubtotal <= 0) {
    return { payable: 0, capApplied: false };
  }
  const floor = money(originalSubtotal * (1 - ABSOLUTE_CAP_RATE));
  if (payable < floor) {
    return { payable: floor, capApplied: true };
  }
  return { payable: money(payable), capApplied: false };
}
