import { describe, expect, it, vi } from "vitest";
import { CouponsService } from "../../src/coupons.service";
import type { CouponsRepository } from "../../src/coupons.repository";
import type { CouponRecord } from "../../src/resolve-coupon";

function fakeRepository(overrides: Partial<CouponsRepository> = {}): CouponsRepository {
  return {
    findByCode: vi.fn().mockResolvedValue(null),
    listAvailable: vi.fn().mockResolvedValue([]),
    listAll: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    ...overrides,
  } as unknown as CouponsRepository;
}

const ACTIVE_RECORD: CouponRecord = {
  code: "WELCOME2026",
  label: "15% en toda la compra",
  scope: "GLOBAL",
  categoryName: null,
  discountPercent: 15,
  active: true,
  validFrom: new Date("2026-01-01T00:00:00Z"),
  validTo: new Date("2027-01-01T00:00:00Z"),
};

describe("CouponsService", () => {
  it("resolve delega en el repositorio y aplica resolveCoupon sobre lo que devuelve", async () => {
    const repo = fakeRepository({
      findByCode: vi.fn().mockResolvedValue(ACTIVE_RECORD),
    });
    const service = new CouponsService(repo);

    const result = await service.resolve("WELCOME2026", new Date("2026-06-15"));

    expect(repo.findByCode).toHaveBeenCalledWith("WELCOME2026");
    expect(result).toEqual({
      applied: true,
      coupon: { scope: "GLOBAL", categoryName: undefined, discountPercent: 15 },
    });
  });

  it("resolve retorna NOT_FOUND cuando el repositorio no encuentra el codigo", async () => {
    const repo = fakeRepository();
    const service = new CouponsService(repo);

    const result = await service.resolve("FAKE2026");

    expect(result).toEqual({ applied: false, reason: "NOT_FOUND" });
  });

  it("listAvailable delega en el repositorio con la fecha actual", async () => {
    const now = new Date("2026-06-15");
    const repo = fakeRepository({
      listAvailable: vi.fn().mockResolvedValue([
        { code: "WELCOME2026", label: "15%", scope: "GLOBAL", categoryName: null, discountPercent: 15 },
      ]),
    });
    const service = new CouponsService(repo);

    const result = await service.listAvailable(now);

    expect(repo.listAvailable).toHaveBeenCalledWith(now);
    expect(result).toHaveLength(1);
  });

  it("create delega en el repositorio con el input recibido", () => {
    const repo = fakeRepository();
    const service = new CouponsService(repo);
    const input = {
      code: "TECH30",
      label: "30% en Tecnologia",
      scope: "CATEGORY" as const,
      categoryName: "Tecnologia",
      discountPercent: 30,
    };

    service.create(input);

    expect(repo.create).toHaveBeenCalledWith(input);
  });

  it("update delega en el repositorio con el id y los cambios", () => {
    const repo = fakeRepository();
    const service = new CouponsService(repo);

    service.update("coupon-id", { active: false });

    expect(repo.update).toHaveBeenCalledWith("coupon-id", { active: false });
  });

  it("listAll delega en el repositorio (sin filtrar por vigencia, a diferencia de listAvailable)", async () => {
    const repo = fakeRepository({
      listAll: vi.fn().mockResolvedValue([
        { id: "c1", code: "EXPIRED2025", label: "vencido", scope: "GLOBAL", categoryName: null, discountPercent: 20, active: true, validFrom: null, validTo: null },
      ]),
    });
    const service = new CouponsService(repo);

    const result = await service.listAll();

    expect(repo.listAll).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  it("remove delega en el repositorio con el id", () => {
    const repo = fakeRepository();
    const service = new CouponsService(repo);

    service.remove("coupon-id");

    expect(repo.remove).toHaveBeenCalledWith("coupon-id");
  });
});
