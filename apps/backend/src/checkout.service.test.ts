import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { BadRequestException, ConflictException } from "@nestjs/common";
import { seedCatalog } from "./catalog";
import { CheckoutService } from "./checkout.service";
import { InMemoryOrderStore } from "./orders.store";

function service() {
  return new CheckoutService(seedCatalog(), new InMemoryOrderStore());
}

describe("CheckoutService", () => {
  it("quote no muta stock", () => {
    const checkout = service();
    const before = checkout.products().find((p) => p.id === "cable")?.stock;
    checkout.preview({ lines: [{ productId: "cable", quantity: 1 }] });
    const after = checkout.products().find((p) => p.id === "cable")?.stock;
    expect(after).toBe(before);
  });

  it("checkout decrementa stock y persiste", () => {
    const checkout = service();
    const order = checkout.checkout({
      lines: [{ productId: "cable", quantity: 1 }],
    });
    expect(order.orderId).toMatch(/^ord-/);
    expect(checkout.products().find((p) => p.id === "cable")?.stock).toBe(1);
  });

  it("stock insuficiente", () => {
    const checkout = service();
    expect(() =>
      checkout.checkout({ lines: [{ productId: "cable", quantity: 3 }] }),
    ).toThrow(ConflictException);
  });

  it("carrito vacío", () => {
    const checkout = service();
    expect(() => checkout.preview({ lines: [] })).toThrow(BadRequestException);
  });

  it("cupón inválido", () => {
    const checkout = service();
    expect(() =>
      checkout.preview({
        lines: [{ productId: "silla", quantity: 1 }],
        couponCode: "NOPE",
      }),
    ).toThrow(BadRequestException);
  });
});
