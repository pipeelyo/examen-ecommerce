import { BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { ProductsRepository } from "../../src/products/products.repository";
import { ProductsService } from "../../src/products/products.service";
import { MemDb, createPrismaStub } from "./in-memory-prisma";

const UUID = "11111111-1111-4111-8111-111111111111";

function setup() {
  const db = new MemDb();
  const tech = db.addCategory("Tecnologia");
  const product = db.addProduct({
    id: UUID,
    sku: "LAPTOP-14",
    name: "Laptop",
    unitPrice: 700,
    categoryId: tech.id,
    stock: 10,
  });
  const repo = new ProductsRepository(createPrismaStub(db));
  const service = new ProductsService(repo);
  return { db, tech, product, service };
}

describe("ProductsService", () => {
  it("list() omite productos con soft delete", async () => {
    const { service, product } = setup();
    await service.softDelete(product.id);
    const listed = await service.list();
    expect(listed).toEqual([]);
  });

  it("getById sigue devolviendo un producto inactivo (nunca DELETE físico)", async () => {
    const { service, product, db } = setup();
    await service.softDelete(product.id);
    const found = await service.getById(product.id);
    expect(found.active).toBe(false);
    expect(found.id).toBe(product.id);
    expect(db.products.has(product.id)).toBe(true);
  });

  it("update no toca stock", async () => {
    const { service, product } = setup();
    const updated = await service.update(product.id, { name: "Laptop 14" });
    expect(updated.name).toBe("Laptop 14");
    expect(updated.stock).toBe(10);
  });

  it("adjustStock con delta negativo mayor al stock se rechaza y no deja stock negativo", async () => {
    const { service, product } = setup();
    await expect(service.adjustStock(product.id, -11)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    const still = await service.getById(product.id);
    expect(still.stock).toBe(10);
  });

  it("adjustStock positivo incrementa", async () => {
    const { service, product } = setup();
    const updated = await service.adjustStock(product.id, 3);
    expect(updated.stock).toBe(13);
  });

  it("create persiste sku/categoría/stock", async () => {
    const { service, tech } = setup();
    const created = await service.create({
      sku: "PHONE-X",
      name: "Smartphone",
      unitPrice: 500,
      categoryId: tech.id,
      stock: 15,
    });
    expect(created.sku).toBe("PHONE-X");
    expect(created.categoryName).toBe("Tecnologia");
    expect(created.stock).toBe(15);
  });

  it("listCategories devuelve las categorías sembradas", async () => {
    const { service, tech } = setup();
    const categories = await service.listCategories();
    expect(categories).toEqual([{ id: tech.id, name: "Tecnologia" }]);
  });

  it("getById inexistente lanza 404", async () => {
    const { service } = setup();
    await expect(
      service.getById("22222222-2222-4222-8222-222222222222"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
