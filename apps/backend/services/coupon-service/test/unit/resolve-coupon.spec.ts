import { describe, expect, it } from "vitest";
import { resolveCoupon, type CouponRecord } from "../../src/resolve-coupon";

const NOW = new Date("2026-06-15T00:00:00Z");

function record(overrides: Partial<CouponRecord> = {}): CouponRecord {
  return {
    code: "WELCOME2026",
    label: "15% en toda la compra",
    scope: "GLOBAL",
    categoryName: null,
    discountPercent: 15,
    active: true,
    validFrom: new Date("2026-01-01T00:00:00Z"),
    validTo: new Date("2027-01-01T00:00:00Z"),
    ...overrides,
  };
}

describe("resolveCoupon", () => {
  it("retorna INVALID_COUPON si el registro no existe", () => {
    const result = resolveCoupon(null, NOW);
    expect(result).toEqual({ applied: false, reason: "INVALID_COUPON" });
  });

  it("retorna INVALID_COUPON si el cupon esta inactivo", () => {
    const result = resolveCoupon(record({ active: false }), NOW);
    expect(result).toEqual({ applied: false, reason: "INVALID_COUPON" });
  });

  it("retorna EXPIRED_COUPON si now es posterior a valid_to", () => {
    const result = resolveCoupon(
      record({ validTo: new Date("2025-12-31T00:00:00Z") }),
      NOW,
    );
    expect(result).toEqual({ applied: false, reason: "EXPIRED_COUPON" });
  });

  it("retorna NOT_YET_VALID si now es anterior a valid_from", () => {
    const result = resolveCoupon(
      record({ validFrom: new Date("2027-06-01T00:00:00Z") }),
      NOW,
    );
    expect(result).toEqual({ applied: false, reason: "NOT_YET_VALID" });
  });

  it("resuelve un cupon GLOBAL vigente", () => {
    const result = resolveCoupon(record(), NOW);
    expect(result).toEqual({
      applied: true,
      coupon: { scope: "GLOBAL", categoryName: undefined, discountPercent: 15 },
    });
  });

  it("resuelve un cupon CATEGORY vigente con su categoryName", () => {
    const result = resolveCoupon(
      record({ scope: "CATEGORY", categoryName: "Tecnologia", discountPercent: 30 }),
      NOW,
    );
    expect(result).toEqual({
      applied: true,
      coupon: { scope: "CATEGORY", categoryName: "Tecnologia", discountPercent: 30 },
    });
  });

  it("sin valid_from/valid_to definidos, un cupon activo siempre aplica", () => {
    const result = resolveCoupon(
      record({ validFrom: null, validTo: null }),
      NOW,
    );
    expect(result.applied).toBe(true);
  });

  it("es vigente exactamente en el limite de valid_from y valid_to (inclusive)", () => {
    const from = new Date("2026-01-01T00:00:00Z");
    const to = new Date("2027-01-01T00:00:00Z");
    expect(resolveCoupon(record({ validFrom: from }), from).applied).toBe(true);
    expect(resolveCoupon(record({ validTo: to }), to).applied).toBe(true);
  });
});
