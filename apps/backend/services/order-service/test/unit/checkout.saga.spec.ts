import { describe, expect, it, vi } from "vitest";
import type { CatalogClient, ProductRecord } from "../../src/clients/catalog.client";
import type { CouponClient } from "../../src/clients/coupon.client";
import type { CheckoutBreakdown, DiscountClient } from "../../src/clients/discount.client";
import { CheckoutSaga, type CheckoutInput } from "../../src/orders/checkout.saga";
import type { OrdersRepository } from "../../src/orders/orders.repository";

const LAPTOP: ProductRecord = {
  id: "11111111-1111-1111-1111-111111111111",
  sku: "LAPTOP",
  name: "Laptop",
  unitPrice: 700,
  categoryId: "cat-tech",
  categoryName: "Tecnologia",
  stock: 9,
  active: true,
};

const BREAKDOWN: CheckoutBreakdown = {
  originalSubtotal: 70000,
  breakdown: {
    category: { applied: true, amount: 7000 },
    volume: { applied: false, amount: 0, reason: "NOT_APPLICABLE" },
    coupon: { applied: false, amount: 0, reason: "NOT_APPLICABLE" },
    cappedAt35: false,
  },
  totalDiscount: 7000,
  effectiveDiscountPercentage: 10,
  finalTotal: 63000,
};

function fakeCatalog(overrides: Partial<CatalogClient> = {}): CatalogClient {
  return {
    reserveStock: vi.fn().mockResolvedValue({ ok: true, products: [LAPTOP] }),
    releaseStock: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function fakeCoupons(overrides: Partial<CouponClient> = {}): CouponClient {
  return {
    resolve: vi.fn().mockResolvedValue({ applied: false, reason: "INVALID_COUPON" }),
    ...overrides,
  };
}

function fakeDiscount(overrides: Partial<DiscountClient> = {}): DiscountClient {
  return {
    calculate: vi.fn().mockResolvedValue(BREAKDOWN),
    ...overrides,
  };
}

function fakeRepository(overrides: Partial<OrdersRepository> = {}): OrdersRepository {
  return {
    createOrder: vi.fn().mockResolvedValue({
      id: "order-1",
      status: "CONFIRMED",
      finalTotal: 63000,
      createdAt: new Date("2026-06-15"),
    }),
    findById: vi.fn(),
    ...overrides,
  } as unknown as OrdersRepository;
}

const BASE_INPUT: CheckoutInput = {
  items: [{ productId: LAPTOP.id, quantity: 1 }],
};

describe("CheckoutSaga", () => {
  it("camino feliz: reserva, calcula sin cupon y persiste la orden", async () => {
    const catalog = fakeCatalog();
    const coupons = fakeCoupons();
    const discount = fakeDiscount();
    const repository = fakeRepository();
    const saga = new CheckoutSaga(catalog, coupons, discount, repository);

    const result = await saga.run(BASE_INPUT);

    expect(result).toEqual({
      ok: true,
      order: { id: "order-1", status: "CONFIRMED", finalTotal: 63000, createdAt: new Date("2026-06-15") },
    });
    expect(coupons.resolve).not.toHaveBeenCalled();
    expect(discount.calculate).toHaveBeenCalledWith({
      lines: [{ productId: LAPTOP.id, category: "Tecnologia", originalAmount: 70000 }],
      resolvedCoupon: undefined,
    });
    expect(catalog.releaseStock).not.toHaveBeenCalled();
  });

  it("stock insuficiente: aborta antes de resolver cupon o calcular, no compensa (nada que deshacer)", async () => {
    const catalog = fakeCatalog({
      reserveStock: vi.fn().mockResolvedValue({ ok: false, productId: LAPTOP.id }),
    });
    const coupons = fakeCoupons();
    const discount = fakeDiscount();
    const repository = fakeRepository();
    const saga = new CheckoutSaga(catalog, coupons, discount, repository);

    const result = await saga.run(BASE_INPUT);

    expect(result).toEqual({ ok: false, reason: "STOCK_INSUFFICIENT", productId: LAPTOP.id });
    expect(coupons.resolve).not.toHaveBeenCalled();
    expect(discount.calculate).not.toHaveBeenCalled();
    expect(catalog.releaseStock).not.toHaveBeenCalled();
    expect(repository.createOrder).not.toHaveBeenCalled();
  });

  it("cupon valido: se resuelve y se pasa al motor de descuentos", async () => {
    const catalog = fakeCatalog();
    const coupons = fakeCoupons({
      resolve: vi.fn().mockResolvedValue({
        applied: true,
        coupon: { scope: "GLOBAL", discountPercent: 15 },
      }),
    });
    const discount = fakeDiscount();
    const repository = fakeRepository();
    const saga = new CheckoutSaga(catalog, coupons, discount, repository);

    await saga.run({ ...BASE_INPUT, couponCode: "WELCOME2026" });

    expect(coupons.resolve).toHaveBeenCalledWith("WELCOME2026");
    expect(discount.calculate).toHaveBeenCalledWith(
      expect.objectContaining({ resolvedCoupon: { scope: "GLOBAL", discountPercent: 15 } }),
    );
  });

  it("cupon no aplicable (expirado/invalido): el motor recibe resolvedCoupon undefined, no bloquea el checkout", async () => {
    const catalog = fakeCatalog();
    const coupons = fakeCoupons({
      resolve: vi.fn().mockResolvedValue({ applied: false, reason: "EXPIRED_COUPON" }),
    });
    const discount = fakeDiscount();
    const repository = fakeRepository();
    const saga = new CheckoutSaga(catalog, coupons, discount, repository);

    const result = await saga.run({ ...BASE_INPUT, couponCode: "EXPIRED2025" });

    expect(result.ok).toBe(true);
    expect(discount.calculate).toHaveBeenCalledWith(
      expect.objectContaining({ resolvedCoupon: undefined }),
    );
  });

  it("discount-service falla: compensa liberando el stock reservado", async () => {
    const catalog = fakeCatalog();
    const coupons = fakeCoupons();
    const discount = fakeDiscount({
      calculate: vi.fn().mockRejectedValue(new Error("discount-service respondio 503")),
    });
    const repository = fakeRepository();
    const saga = new CheckoutSaga(catalog, coupons, discount, repository);

    const result = await saga.run(BASE_INPUT);

    expect(result).toEqual({
      ok: false,
      reason: "DOWNSTREAM_ERROR",
      detail: "discount-service respondio 503",
    });
    expect(catalog.releaseStock).toHaveBeenCalledWith(BASE_INPUT.items);
    expect(repository.createOrder).not.toHaveBeenCalled();
  });

  it("falla la persistencia tras reservar y calcular: compensa liberando el stock", async () => {
    const catalog = fakeCatalog();
    const coupons = fakeCoupons();
    const discount = fakeDiscount();
    const repository = fakeRepository({
      createOrder: vi.fn().mockRejectedValue(new Error("db unavailable")),
    });
    const saga = new CheckoutSaga(catalog, coupons, discount, repository);

    const result = await saga.run(BASE_INPUT);

    expect(result).toEqual({ ok: false, reason: "PERSISTENCE_FAILED" });
    expect(catalog.releaseStock).toHaveBeenCalledTimes(1);
    expect(catalog.releaseStock).toHaveBeenCalledWith(BASE_INPUT.items);
  });

  it("catalog-service devuelve una respuesta inconsistente (falta un producto reservado): falla antes de calcular", async () => {
    const catalog = fakeCatalog({
      reserveStock: vi.fn().mockResolvedValue({ ok: true, products: [] }),
    });
    const coupons = fakeCoupons();
    const discount = fakeDiscount();
    const repository = fakeRepository();
    const saga = new CheckoutSaga(catalog, coupons, discount, repository);

    await expect(saga.run(BASE_INPUT)).rejects.toThrow(
      `catalog-service no devolvio el producto ${LAPTOP.id}`,
    );
    expect(discount.calculate).not.toHaveBeenCalled();
  });

  it("checkout de invitado: guestInfo se propaga intacto al repositorio", async () => {
    const catalog = fakeCatalog();
    const coupons = fakeCoupons();
    const discount = fakeDiscount();
    const repository = fakeRepository();
    const saga = new CheckoutSaga(catalog, coupons, discount, repository);
    const guestInfo = {
      fullName: "Cliente Demo",
      email: "cliente@demo.test",
      phone: "555-0100",
      address: "Calle Falsa 123",
    };

    await saga.run({ ...BASE_INPUT, userId: null, guestInfo });

    expect(repository.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ userId: null, guestInfo }),
    );
  });
});
