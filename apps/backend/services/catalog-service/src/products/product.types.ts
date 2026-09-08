export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type StockItemInput = {
  productId: string;
  quantity: number;
};

export type ProductRecord = {
  id: string;
  sku: string;
  name: string;
  unitPrice: number;
  categoryId: string;
  categoryName: string;
  stock: number;
  active: boolean;
};

export type CreateProductInput = {
  sku: string;
  name: string;
  unitPrice: number;
  categoryId: string;
  stock: number;
};

export type UpdateProductInput = {
  name?: string;
  unitPrice?: number;
  categoryId?: string;
};
