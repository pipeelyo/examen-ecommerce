import type {
  CartItemInput,
  CatalogClient,
  ProductRecord,
  ReserveStockResult,
} from "./catalog.client";

export class HttpCatalogClient implements CatalogClient {
  constructor(
    private readonly baseUrl: string,
    private readonly internalToken: string,
  ) {}

  async reserveStock(items: CartItemInput[]): Promise<ReserveStockResult> {
    const res = await fetch(`${this.baseUrl}/internal/stock/reserve`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ items }),
    });
    if (res.status === 409) {
      const body = (await res.json()) as { productId: string };
      return { ok: false, productId: body.productId };
    }
    if (!res.ok) {
      throw new Error(`catalog-service reserveStock respondio ${res.status}`);
    }
    const products = (await res.json()) as ProductRecord[];
    return { ok: true, products };
  }

  async releaseStock(items: CartItemInput[]): Promise<void> {
    const res = await fetch(`${this.baseUrl}/internal/stock/release`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ items }),
    });
    if (!res.ok) {
      throw new Error(`catalog-service releaseStock respondio ${res.status}`);
    }
  }

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "X-Internal-Token": this.internalToken,
    };
  }
}
