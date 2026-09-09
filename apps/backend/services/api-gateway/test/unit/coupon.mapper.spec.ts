import { describe, expect, it } from "vitest";
import { toCouponValidDto } from "../../src/coupons/coupon.mapper";

describe("toCouponValidDto", () => {
  it("cupon aplicable: valid=true con discountPct en fraccion (15 -> 0.15)", () => {
    const result = toCouponValidDto("WELCOME2026", { applied: true, coupon: { discountPercent: 15 } });
    expect(result).toEqual({ code: "WELCOME2026", valid: true, discountPct: 0.15 });
  });

  it("cupon vencido: valid=false, reason=EXPIRED", () => {
    const result = toCouponValidDto("EXPIRED2025", { applied: false, reason: "EXPIRED_COUPON" });
    expect(result).toEqual({ code: "EXPIRED2025", valid: false, reason: "EXPIRED" });
  });

  it("cupon inactivo: valid=false, reason=INVALID", () => {
    const result = toCouponValidDto("INACTIVE2026", { applied: false, reason: "INVALID_COUPON" });
    expect(result).toEqual({ code: "INACTIVE2026", valid: false, reason: "INVALID" });
  });

  it("cupon aun no vigente: el CONTRACT no distingue, colapsa a INVALID", () => {
    const result = toCouponValidDto("FUTURE2027", { applied: false, reason: "NOT_YET_VALID" });
    expect(result).toEqual({ code: "FUTURE2027", valid: false, reason: "INVALID" });
  });

  it("30% entero se convierte a 0.30, no a 30", () => {
    const result = toCouponValidDto("TECH30", { applied: true, coupon: { discountPercent: 30 } });
    expect(result.discountPct).toBe(0.3);
  });
});
