import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { InsufficientStockException } from "../../src/common/insufficient-stock.exception";
import { ProductsRepository } from "../../src/products/products.repository";
import { StockService } from "../../src/stock/stock.service";
import { MemDb, createPrismaStub } from "./in-memory-prisma";

const LAPTOP = "11111111-1111-4111-8111-111111111111";
const PHONE = "22222222-2222-4222-8222-222222222222";

function setup(stock = { laptop: 10, phone: 5 }) {
  const db = new MemDb();
  const tech = db.addCategory("Tecnologia");
  db.addProduct({
    id: LAPTOP,
    sku: "LAPTOP-14",
    name: "Laptop",
    unitPrice: 700,
    categoryId: tech.id,
    stock: stock.laptop,
  });
  db.addProduct({
    id: PHONE,
    sku: "PHONE-X",
    name: "Smartphone",
    unitPrice: 500,
    categoryId: tech.id,
    stock: stock.phone,
  });
  const service = new StockService(new ProductsRepository(createPrismaStub(db)));
  return { db, service };
}

describe("StockService.reserveStock / releaseStock", () => {
  it("reserva exitosa decrementa todas las líneas", async () => {
    const { service, db } = setup();
    await service.reserveStock([
      { productId: LAPTOP, quantity: 3 },
      { productId: PHONE, quantity: 2 },
    ]);
    expect(db.products.get(LAPTOP)?.stock).toBe(7);
    expect(db.products.get(PHONE)?.stock).toBe(3);
  });

  it("una línea sin stock revierte todas; ninguna queda decrementada", async () => {
    const { service, db } = setup({ laptop: 10, phone: 1 });
    await expect(
      service.reserveStock([
        { productId: LAPTOP, quantity: 3 },
        { productId: PHONE, quantity: 2 },
      ]),
    ).rejects.toBeInstanceOf(InsufficientStockException);
    expect(db.products.get(LAPTOP)?.stock).toBe(10);
    expect(db.products.get(PHONE)?.stock).toBe(1);
  });

  it("cantidad exactamente igual al stock disponible es éxito (stock final 0)", async () => {
    const { service, db } = setup({ laptop: 4, phone: 5 });
    await service.reserveStock([{ productId: LAPTOP, quantity: 4 }]);
    expect(db.products.get(LAPTOP)?.stock).toBe(0);
  });

  it("payload corrupto (quantity -1 o productId no UUID) rechaza antes de tocar stock", async () => {
    const { service, db } = setup();
    await expect(
      service.reserveStock([{ productId: LAPTOP, quantity: -1 }]),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.reserveStock([{ productId: "no-uuid", quantity: 1 }]),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(db.products.get(LAPTOP)?.stock).toBe(10);
  });

  it("dos reservas concurrentes por el mismo stock: una gana, la otra falla, stock nunca negativo", async () => {
    const { service, db } = setup({ laptop: 10, phone: 5 });
    const results = await Promise.allSettled([
      service.reserveStock([{ productId: LAPTOP, quantity: 8 }]),
      service.reserveStock([{ productId: LAPTOP, quantity: 8 }]),
    ]);
    const fulfilled = results.filter((row) => row.status === "fulfilled");
    const rejected = results.filter((row) => row.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(db.products.get(LAPTOP)?.stock).toBe(2);
  });

  it("releaseStock incrementa el stock (compensación de saga)", async () => {
    const { service, db } = setup({ laptop: 7, phone: 5 });
    await service.releaseStock([{ productId: LAPTOP, quantity: 3 }]);
    expect(db.products.get(LAPTOP)?.stock).toBe(10);
  });
});
