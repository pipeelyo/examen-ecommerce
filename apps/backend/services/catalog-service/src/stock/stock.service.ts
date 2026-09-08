import { Injectable } from "@nestjs/common";
import { ProductsRepository } from "../products/products.repository";
import type { ProductRecord, StockItemInput } from "../products/product.types";

@Injectable()
export class StockService {
  constructor(private readonly repo: ProductsRepository) {}

  reserveStock(items: StockItemInput[]): Promise<ProductRecord[]> {
    return this.repo.reserveStock(items);
  }

  releaseStock(items: StockItemInput[]): Promise<ProductRecord[]> {
    return this.repo.releaseStock(items);
  }
}
