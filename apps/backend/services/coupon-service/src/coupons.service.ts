import { ConflictException, Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  CouponsRepository,
  type AdminCoupon,
  type AvailableCoupon,
  type CreateCouponInput,
  type UpdateCouponInput,
} from "./coupons.repository";
import { resolveCoupon, type ResolveCouponResult } from "./resolve-coupon";

@Injectable()
export class CouponsService {
  constructor(
    @Inject(CouponsRepository)
    private readonly repository: CouponsRepository,
  ) {}

  async resolve(code: string, now: Date = new Date()): Promise<ResolveCouponResult> {
    const record = await this.repository.findByCode(code);
    return resolveCoupon(record, now);
  }

  listAvailable(now: Date = new Date()): Promise<AvailableCoupon[]> {
    return this.repository.listAvailable(now);
  }

  listAll(): Promise<AdminCoupon[]> {
    return this.repository.listAll();
  }

  async create(input: CreateCouponInput) {
    try {
      return await this.repository.create(input);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException({
          code: "DUPLICATE_CODE",
          message: `Ya existe un cupón con el código ${input.code}`,
        });
      }
      throw error;
    }
  }

  update(id: string, input: UpdateCouponInput) {
    return this.repository.update(id, input);
  }

  remove(id: string): Promise<void> {
    return this.repository.remove(id);
  }
}
