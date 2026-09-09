export interface PreviewCartItem {
  productId: string;
  quantity: number;
}

export interface PreviewRequest {
  items: PreviewCartItem[];
  couponCode?: string;
}

export interface ProductLookup {
  id: string;
  unitPrice: number;
  categoryName: string;
}

export interface ResolvedCoupon {
  scope: "GLOBAL" | "CATEGORY";
  categoryName?: string;
  discountPercent: number;
}

export type ResolveCouponResult =
  | { applied: true; coupon: ResolvedCoupon }
  | { applied: false; reason: "INVALID_COUPON" | "EXPIRED_COUPON" | "NOT_YET_VALID" };

export interface CalculateInput {
  lines: Array<{ productId: string; category: string; originalAmount: number }>;
  resolvedCoupon?: ResolvedCoupon;
}

export type CheckoutBreakdown = Record<string, unknown>;

export type PreviewResult =
  | { ok: true; breakdown: CheckoutBreakdown }
  | { ok: false; reason: "PRODUCT_NOT_FOUND"; productId: string };

export interface PreviewDeps {
  getProduct(id: string): Promise<ProductLookup | null>;
  resolveCoupon(code: string): Promise<ResolveCouponResult>;
  calculate(input: CalculateInput): Promise<CheckoutBreakdown>;
}

/**
 * HU2: arma el desglose sin persistir ni reservar stock — solo consulta
 * catalogo (GET publico, nunca /internal/stock/reserve) y reusa el mismo
 * discount-service que usa el checkout real. Cero logica de calculo propia.
 */
export async function buildPreview(
  input: PreviewRequest,
  deps: PreviewDeps,
): Promise<PreviewResult> {
  const lines: CalculateInput["lines"] = [];

  for (const item of input.items) {
    const product = await deps.getProduct(item.productId);
    if (!product) {
      return { ok: false, reason: "PRODUCT_NOT_FOUND", productId: item.productId };
    }
    lines.push({
      productId: product.id,
      category: product.categoryName,
      originalAmount: Math.round(product.unitPrice * 100) * item.quantity,
    });
  }

  let resolvedCoupon: ResolvedCoupon | undefined;
  if (input.couponCode) {
    const result = await deps.resolveCoupon(input.couponCode);
    resolvedCoupon = result.applied ? result.coupon : undefined;
  }

  const breakdown = await deps.calculate({ lines, resolvedCoupon });
  return { ok: true, breakdown };
}
