import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import type { CouponRecord, CouponScope } from "./resolve-coupon";

export interface CreateCouponInput {
  code: string;
  label: string;
  scope: CouponScope;
  categoryName?: string;
  discountPercent: number;
  validFrom?: Date;
  validTo?: Date;
}

export interface UpdateCouponInput {
  label?: string;
  active?: boolean;
  discountPercent?: number;
  validFrom?: Date | null;
  validTo?: Date | null;
}

export interface AvailableCoupon {
  code: string;
  label: string;
  scope: CouponScope;
  categoryName: string | null;
  discountPercent: number;
}

export interface AdminCoupon {
  id: string;
  code: string;
  label: string;
  scope: CouponScope;
  categoryName: string | null;
  discountPercent: number;
  active: boolean;
  validFrom: Date | null;
  validTo: Date | null;
}

const prisma = new PrismaClient();

@Injectable()
export class CouponsRepository {
  async findByCode(code: string): Promise<CouponRecord | null> {
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon) return null;
    return {
      code: coupon.code,
      label: coupon.label,
      scope: coupon.scope as CouponScope,
      categoryName: coupon.categoryName,
      discountPercent: coupon.discountPercent,
      active: coupon.active,
      validFrom: coupon.validFrom,
      validTo: coupon.validTo,
    };
  }

  async listAvailable(now: Date): Promise<AvailableCoupon[]> {
    return prisma.coupon.findMany({
      where: {
        active: true,
        AND: [
          { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
          { OR: [{ validTo: null }, { validTo: { gte: now } }] },
        ],
      },
      select: {
        code: true,
        label: true,
        scope: true,
        categoryName: true,
        discountPercent: true,
      },
    }) as unknown as Promise<AvailableCoupon[]>;
  }

  async listAll(): Promise<AdminCoupon[]> {
    const rows = await prisma.coupon.findMany({ orderBy: { code: "asc" } });
    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      label: row.label,
      scope: row.scope as CouponScope,
      categoryName: row.categoryName,
      discountPercent: row.discountPercent,
      active: row.active,
      validFrom: row.validFrom,
      validTo: row.validTo,
    }));
  }

  async remove(id: string): Promise<void> {
    await prisma.coupon.delete({ where: { id } });
  }

  async create(input: CreateCouponInput) {
    return prisma.coupon.create({
      data: {
        code: input.code,
        label: input.label,
        scope: input.scope,
        categoryName: input.categoryName,
        discountPercent: input.discountPercent,
        validFrom: input.validFrom,
        validTo: input.validTo,
      },
    });
  }

  async update(id: string, input: UpdateCouponInput) {
    return prisma.coupon.update({ where: { id }, data: input });
  }
}
