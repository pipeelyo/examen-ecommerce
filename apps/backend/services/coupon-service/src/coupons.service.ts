import { Injectable } from "@nestjs/common";
import {
  CouponsRepository,
  type AvailableCoupon,
  type CreateCouponInput,
  type UpdateCouponInput,
} from "./coupons.repository";
import { resolveCoupon, type ResolveCouponResult } from "./resolve-coupon";

@Injectable()
export class CouponsService {
  constructor(
    private readonly repository: CouponsRepository = new CouponsRepository(),
  ) {}

  async resolve(code: string, now: Date = new Date()): Promise<ResolveCouponResult> {
    const record = await this.repository.findByCode(code);
    return resolveCoupon(record, now);
  }

  listAvailable(now: Date = new Date()): Promise<AvailableCoupon[]> {
    return this.repository.listAvailable(now);
  }

  create(input: CreateCouponInput) {
    return this.repository.create(input);
  }

  update(id: string, input: UpdateCouponInput) {
    return this.repository.update(id, input);
  }
}
