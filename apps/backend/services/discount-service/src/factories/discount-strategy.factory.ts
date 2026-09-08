import { CategoryDiscountStrategy } from "../strategies/category-discount.strategy";
import { CouponDiscountStrategy } from "../strategies/coupon-discount.strategy";
import type { DiscountStrategy } from "../strategies/discount-strategy.interface";
import { VolumeDiscountStrategy } from "../strategies/volume-discount.strategy";

export class DiscountStrategyFactory {
  buildPipeline(): DiscountStrategy[] {
    return [
      new CategoryDiscountStrategy(),
      new VolumeDiscountStrategy(),
      new CouponDiscountStrategy(),
    ];
  }
}
