export interface CartItemInput {
  productId: string;
  quantity: number;
}

export interface ProductRecord {
  id: string;
  sku: string;
  name: string;
  unitPrice: number;
  categoryId: string;
  categoryName: string;
  stock: number;
  active: boolean;
}

export type ReserveStockResult =
  | { ok: true; products: ProductRecord[] }
  | { ok: false; productId: string };

export interface CatalogClient {
  reserveStock(items: CartItemInput[]): Promise<ReserveStockResult>;
  releaseStock(items: CartItemInput[]): Promise<void>;
}
