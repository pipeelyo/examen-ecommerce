import { describe, expect, it, vi } from "vitest";
import {
  buildPreview,
  type PreviewDeps,
  type ProductLookup,
} from "../../src/checkout/preview.orchestrator";

const LAPTOP: ProductLookup = { id: "p1", unitPrice: 700, categoryName: "Tecnologia" };
const BOOK: ProductLookup = { id: "p2", unitPrice: 30, categoryName: "Libros" };

function fakeDeps(overrides: Partial<PreviewDeps> = {}): PreviewDeps {
  return {
    getProduct: vi.fn().mockImplementation(async (id: string) => {
      if (id === "p1") return LAPTOP;
      if (id === "p2") return BOOK;
      return null;
    }),
    resolveCoupon: vi.fn().mockResolvedValue({ applied: false, reason: "INVALID_COUPON" }),
    calculate: vi.fn().mockResolvedValue({ finalTotal: 73000 }),
    ...overrides,
  };
}

describe("buildPreview", () => {
  it("arma las lineas en centavos y calcula sin cupon", async () => {
    const deps = fakeDeps();

    const result = await buildPreview({ items: [{ productId: "p1", quantity: 1 }, { productId: "p2", quantity: 1 }] }, deps);

    expect(result).toEqual({ ok: true, breakdown: { finalTotal: 73000 } });
    expect(deps.resolveCoupon).not.toHaveBeenCalled();
    expect(deps.calculate).toHaveBeenCalledWith({
      lines: [
        { productId: "p1", category: "Tecnologia", originalAmount: 70000 },
        { productId: "p2", category: "Libros", originalAmount: 3000 },
      ],
      resolvedCoupon: undefined,
    });
  });

  it("multiplica el precio unitario por la cantidad al convertir a centavos", async () => {
    const deps = fakeDeps();

    await buildPreview({ items: [{ productId: "p1", quantity: 3 }] }, deps);

    expect(deps.calculate).toHaveBeenCalledWith(
      expect.objectContaining({ lines: [{ productId: "p1", category: "Tecnologia", originalAmount: 210000 }] }),
    );
  });

  it("producto inexistente: aborta antes de resolver cupon o calcular", async () => {
    const deps = fakeDeps();

    const result = await buildPreview({ items: [{ productId: "no-existe", quantity: 1 }] }, deps);

    expect(result).toEqual({ ok: false, reason: "PRODUCT_NOT_FOUND", productId: "no-existe" });
    expect(deps.calculate).not.toHaveBeenCalled();
  });

  it("cupon valido: se resuelve y se pasa al motor de descuentos", async () => {
    const deps = fakeDeps({
      resolveCoupon: vi.fn().mockResolvedValue({
        applied: true,
        coupon: { scope: "GLOBAL", discountPercent: 15 },
      }),
    });

    await buildPreview({ items: [{ productId: "p1", quantity: 1 }], couponCode: "WELCOME2026" }, deps);

    expect(deps.resolveCoupon).toHaveBeenCalledWith("WELCOME2026");
    expect(deps.calculate).toHaveBeenCalledWith(
      expect.objectContaining({ resolvedCoupon: { scope: "GLOBAL", discountPercent: 15 } }),
    );
  });

  it("cupon no aplicable: el motor recibe resolvedCoupon undefined, no bloquea el preview", async () => {
    const deps = fakeDeps({
      resolveCoupon: vi.fn().mockResolvedValue({ applied: false, reason: "EXPIRED_COUPON" }),
    });

    const result = await buildPreview(
      { items: [{ productId: "p1", quantity: 1 }], couponCode: "EXPIRED2025" },
      deps,
    );

    expect(result.ok).toBe(true);
    expect(deps.calculate).toHaveBeenCalledWith(expect.objectContaining({ resolvedCoupon: undefined }));
  });
});
