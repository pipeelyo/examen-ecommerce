import { Injectable, NotFoundException } from "@nestjs/common";
import { ProductsRepository } from "./products.repository";
import type {
  CreateProductInput,
  ProductRecord,
  UpdateProductInput,
} from "./product.types";

@Injectable()
export class ProductsService {
  constructor(private readonly repo: ProductsRepository) {}

  list(): Promise<ProductRecord[]> {
    return this.repo.listActive();
  }

  listCategories() {
    return this.repo.listCategories();
  }

  async getById(id: string): Promise<ProductRecord> {
    const product = await this.repo.findById(id);
    if (!product) {
      throw new NotFoundException(`Producto ${id} no existe`);
    }
    return product;
  }

  create(input: CreateProductInput): Promise<ProductRecord> {
    return this.repo.create(input);
  }

  update(id: string, input: UpdateProductInput): Promise<ProductRecord> {
    return this.repo.update(id, input);
  }

  adjustStock(id: string, delta: number): Promise<ProductRecord> {
    return this.repo.adjustStock(id, delta);
  }

  softDelete(id: string): Promise<ProductRecord> {
    return this.repo.softDelete(id);
  }
}
