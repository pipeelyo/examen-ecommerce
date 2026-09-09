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
