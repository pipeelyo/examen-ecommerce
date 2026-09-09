import { Injectable } from "@nestjs/common";
import { applyAbsoluteCap } from "./apply-absolute-cap";
import { DiscountStrategyFactory } from "./factories/discount-strategy.factory";
import { runningSum } from "./money";
import { scaleDiscountsToCap } from "./scale-discounts-to-cap";
import type {
  CartLineState,
  DiscountContext,
  DiscountResult,
  ResolvedCoupon,
} from "./strategies/discount-strategy.interface";

export type DiscountLineDto = {
  applied: boolean;
  amount: number;
  reason?: DiscountResult["reason"];
};

export type CheckoutBreakdown = {
  originalSubtotal: number;
  breakdown: {
    category: DiscountLineDto;
    volume: DiscountLineDto;
    coupon: DiscountLineDto;
    cappedAt35: boolean;
  };
  totalDiscount: number;
  effectiveDiscountPercentage: number;
  finalTotal: number;
};

export type CalculateInput = {
  originalSubtotal?: number;
  lines: Array<
    Pick<CartLineState, "productId" | "category" | "originalAmount"> &
      Partial<Pick<CartLineState, "remainingAmount">>
  >;
  resolvedCoupon?: ResolvedCoupon;
};

function toLineDto(result: DiscountResult): DiscountLineDto {
  return {
    applied: result.applied,
    amount: result.amount,
    reason: result.reason,
  };
}

@Injectable()
export class DiscountEngineService {
  private readonly factory = new DiscountStrategyFactory();

  calculate(input: CalculateInput): CheckoutBreakdown {
    const lines: CartLineState[] = input.lines.map((line) => ({
      productId: line.productId,
      category: line.category,
      originalAmount: line.originalAmount,
      remainingAmount: line.remainingAmount ?? line.originalAmount,
    }));

    const originalSubtotal =
      input.originalSubtotal ??
      lines.reduce((sum, line) => sum + line.originalAmount, 0);

    let ctx: DiscountContext = {
      originalSubtotal,
      lines,
      runningSubtotal: runningSum(lines),
      resolvedCoupon: input.resolvedCoupon,
    };

    const skipped: DiscountResult = {
      name: "CATEGORY",
      amount: 0,
      subtotalAfter: ctx.runningSubtotal,
      applied: false,
      reason: "NOT_APPLICABLE",
    };

    let category: DiscountResult = { ...skipped, name: "CATEGORY" };
    let volume: DiscountResult = { ...skipped, name: "VOLUME" };
    let coupon: DiscountResult = { ...skipped, name: "COUPON" };

    if (originalSubtotal === 0 || lines.length === 0) {
      return this.toBreakdown(originalSubtotal, 0, false, category, volume, coupon);
    }

    for (const strategy of this.factory.buildPipeline()) {
      const outcome = strategy.apply(ctx);
      ctx = outcome.ctx;
      if (strategy.name === "CATEGORY") {
        category = outcome.result;
      } else if (strategy.name === "VOLUME") {
        volume = outcome.result;
      } else {
        coupon = outcome.result;
      }
    }

    const capped = applyAbsoluteCap(originalSubtotal, ctx.runningSubtotal);
    const scaled = scaleDiscountsToCap(category.amount, volume.amount, coupon.amount, capped.totalDiscount);
    return this.toBreakdown(
      originalSubtotal,
      capped.totalDiscount,
      capped.cappedAt35,
      { ...category, amount: scaled.category },
      { ...volume, amount: scaled.volume },
      { ...coupon, amount: scaled.coupon },
    );
  }

  private toBreakdown(
    originalSubtotal: number,
    totalDiscount: number,
    cappedAt35: boolean,
    category: DiscountResult,
    volume: DiscountResult,
    coupon: DiscountResult,
  ): CheckoutBreakdown {
    const finalTotal = originalSubtotal - totalDiscount;
    const effectiveDiscountPercentage =
      originalSubtotal === 0
        ? 0
        : Math.round((totalDiscount / originalSubtotal) * 10000) / 100;

    return {
      originalSubtotal,
      breakdown: {
        category: toLineDto(category),
        volume: toLineDto(volume),
        coupon: toLineDto(coupon),
        cappedAt35,
      },
      totalDiscount,
      effectiveDiscountPercentage,
      finalTotal,
    };
  }
}
