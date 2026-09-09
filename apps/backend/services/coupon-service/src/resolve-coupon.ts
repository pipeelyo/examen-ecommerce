export type CouponScope = "GLOBAL" | "CATEGORY";

export type CouponReason = "NOT_FOUND" | "INVALID_COUPON" | "EXPIRED_COUPON" | "NOT_YET_VALID";

export interface CouponRecord {
  code: string;
  label: string;
  scope: CouponScope;
  categoryName: string | null;
  discountPercent: number;
  active: boolean;
  validFrom: Date | null;
  validTo: Date | null;
}

export interface ResolvedCoupon {
  scope: CouponScope;
  categoryName?: string;
  discountPercent: number;
}

export type ResolveCouponResult =
  | { applied: true; coupon: ResolvedCoupon }
  | { applied: false; reason: CouponReason };

/**
 * Pure decision function: dado el registro ya obtenido de la base de datos (o null si no
 * existe), decide si el cupon aplica hoy. Ningun I/O aqui — el fetch vive en
 * CouponsRepository, este archivo solo compara fechas y el flag active.
 */
export function resolveCoupon(
  record: CouponRecord | null,
  now: Date,
): ResolveCouponResult {
  if (!record) {
    return { applied: false, reason: "NOT_FOUND" };
  }
  if (!record.active) {
    return { applied: false, reason: "INVALID_COUPON" };
  }
  if (record.validFrom && now < record.validFrom) {
    return { applied: false, reason: "NOT_YET_VALID" };
  }
  if (record.validTo && now > record.validTo) {
    return { applied: false, reason: "EXPIRED_COUPON" };
  }
  return {
    applied: true,
    coupon: {
      scope: record.scope,
      categoryName: record.categoryName ?? undefined,
      discountPercent: record.discountPercent,
    },
  };
}
