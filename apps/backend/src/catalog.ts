import type { Category } from "@examen/discount-engine";

export type Product = {
  id: string;
  name: string;
  unitPrice: number;
  category: Category;
  stock: number;
};

export interface Catalog {
  list(): Product[];
  get(id: string): Product | undefined;
  decrement(id: string, quantity: number): void;
}

export class InMemoryCatalog implements Catalog {
  constructor(private readonly products: Product[]) {}

  list(): Product[] {
    return this.products.map((product) => ({ ...product }));
  }

  get(id: string): Product | undefined {
    const found = this.products.find((product) => product.id === id);
    return found ? { ...found } : undefined;
  }

  decrement(id: string, quantity: number): void {
    const found = this.products.find((product) => product.id === id);
    if (!found) {
      throw new Error(`Producto ${id} no existe`);
    }
    if (found.stock < quantity) {
      throw new Error(`Stock insuficiente para ${id}`);
    }
    found.stock -= quantity;
  }
}

export const seedCatalog = (): InMemoryCatalog =>
  new InMemoryCatalog([
    { id: "laptop", name: "Laptop", unitPrice: 80, category: "Tecnologia", stock: 10 },
    { id: "mouse", name: "Mouse", unitPrice: 25, category: "Tecnologia", stock: 20 },
    { id: "silla", name: "Silla", unitPrice: 90, category: "Hogar", stock: 5 },
    { id: "camiseta", name: "Camiseta", unitPrice: 20, category: "Ropa", stock: 15 },
    { id: "cable", name: "Cable USB", unitPrice: 12, category: "Otros", stock: 2 },
  ]);
