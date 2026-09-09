import { describe, expect, it } from "vitest";
import { toProductDto, type CatalogProductRecord } from "../../src/products/product.mapper";

function record(overrides: Partial<CatalogProductRecord> = {}): CatalogProductRecord {
  return {
    id: "p-laptop",
    name: "Laptop",
    unitPrice: 700,
    categoryName: "Tecnologia",
    stock: 10,
    ...overrides,
  };
}

describe("toProductDto", () => {
  it("mapea al shape exacto del CONTRACT.md: {id,name,category,price,stock}", () => {
    expect(toProductDto(record())).toEqual({
      id: "p-laptop",
      name: "Laptop",
      category: "Tecnología",
      price: 700,
      stock: 10,
    });
  });

  it("agrega la tilde a Tecnologia/Jugueteria para mostrar, sin tocar el valor interno", () => {
    expect(toProductDto(record({ categoryName: "Jugueteria" })).category).toBe("Juguetería");
  });

  it("deja pasar categorias que ya no necesitan traduccion (Libros, Muebles)", () => {
    expect(toProductDto(record({ categoryName: "Libros" })).category).toBe("Libros");
    expect(toProductDto(record({ categoryName: "Muebles" })).category).toBe("Muebles");
  });

  it("no incluye sku, categoryId ni active — solo los 5 campos del contrato", () => {
    const dto = toProductDto(record());
    expect(Object.keys(dto).sort()).toEqual(["category", "id", "name", "price", "stock"]);
  });
});
