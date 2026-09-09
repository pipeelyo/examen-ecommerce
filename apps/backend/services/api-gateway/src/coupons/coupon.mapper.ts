export type EngineCouponReason = "NOT_FOUND" | "INVALID_COUPON" | "EXPIRED_COUPON" | "NOT_YET_VALID";
export type ContractCouponReason = "INVALID" | "EXPIRED";

export type ResolveCouponResult =
  | { applied: true; coupon: { discountPercent: number } }
  | { applied: false; reason: EngineCouponReason };

export interface CouponValidDto {
  code: string;
  valid: boolean;
  reason?: ContractCouponReason;
  discountPct?: number;
}

const REASON_MAP: Record<Exclude<EngineCouponReason, "NOT_FOUND">, ContractCouponReason> = {
  INVALID_COUPON: "INVALID",
  EXPIRED_COUPON: "EXPIRED",
  NOT_YET_VALID: "INVALID", // el CONTRACT no distingue "aun no vigente"
};

/**
 * NOT_FOUND se resuelve como 404 antes de llegar aqui (ver coupons.controller.ts) —
 * este mapper solo traduce el shape para códigos que sí existen.
 */
export function toCouponValidDto(code: string, result: ResolveCouponResult): CouponValidDto {
  if (result.applied) {
    return { code, valid: true, discountPct: result.coupon.discountPercent / 100 };
  }
  return { code, valid: false, reason: REASON_MAP[result.reason as Exclude<EngineCouponReason, "NOT_FOUND">] };
}
