import type { CartItemInput, CatalogClient } from "../clients/catalog.client";
import type { CouponClient, ResolvedCoupon } from "../clients/coupon.client";
import type { DiscountClient } from "../clients/discount.client";
import type {
  CreateOrderInput,
  GuestInfo,
  OrdersRepository,
  PersistedOrder,
} from "./orders.repository";

export interface CheckoutInput {
  items: CartItemInput[];
  couponCode?: string;
  userId?: string | null;
  guestInfo?: GuestInfo;
}

export type CheckoutResult =
  | { ok: true; order: PersistedOrder }
  | { ok: false; reason: "STOCK_INSUFFICIENT"; productId: string }
  | { ok: false; reason: "DOWNSTREAM_ERROR"; detail: string }
  | { ok: false; reason: "PERSISTENCE_FAILED" };

/**
 * Orquestador de la saga de checkout (SDD §09). El unico paso con efecto
 * persistente antes del commit final es la reserva de stock — por eso es el
 * unico que se compensa (releaseStock) si algo posterior falla. Resolver el
 * cupon y calcular el descuento son de solo lectura / calculo puro: si fallan,
 * no dejaron nada que deshacer.
 */
export class CheckoutSaga {
  constructor(
    private readonly catalog: CatalogClient,
    private readonly coupons: CouponClient,
    private readonly discount: DiscountClient,
    private readonly repository: OrdersRepository,
  ) {}

  async run(input: CheckoutInput): Promise<CheckoutResult> {
    const reserved = await this.catalog.reserveStock(input.items);
    if (!reserved.ok) {
      return { ok: false, reason: "STOCK_INSUFFICIENT", productId: reserved.productId };
    }

    const lines = input.items.map((item) => {
      const product = reserved.products.find((p) => p.id === item.productId);
      if (!product) {
        throw new Error(`catalog-service no devolvio el producto ${item.productId}`);
      }
      return {
        productId: product.id,
        category: product.categoryName,
        quantity: item.quantity,
        unitPriceSnapshot: product.unitPrice,
        originalAmount: Math.round(product.unitPrice * 100) * item.quantity,
      };
    });

    try {
      const resolvedCoupon = await this.resolveCoupon(input.couponCode);

      const breakdown = await this.discount.calculate({
        lines: lines.map(({ productId, category, originalAmount }) => ({
          productId,
          category,
          originalAmount,
        })),
        resolvedCoupon,
      });

      const orderInput: CreateOrderInput = {
        userId: input.userId ?? null,
        guestInfo: input.guestInfo,
        breakdown,
        lines: lines.map((line) => ({
          productId: line.productId,
          category: line.category,
          quantity: line.quantity,
          unitPriceSnapshot: line.unitPriceSnapshot,
          lineDiscountAmount: 0,
        })),
      };

      try {
        const order = await this.repository.createOrder(orderInput);
        return { ok: true, order };
      } catch {
        await this.catalog.releaseStock(input.items);
        return { ok: false, reason: "PERSISTENCE_FAILED" };
      }
    } catch (err) {
      await this.catalog.releaseStock(input.items);
      return { ok: false, reason: "DOWNSTREAM_ERROR", detail: (err as Error).message };
    }
  }

  private async resolveCoupon(code?: string): Promise<ResolvedCoupon | undefined> {
    if (!code) return undefined;
    const result = await this.coupons.resolve(code);
    return result.applied ? result.coupon : undefined;
  }
}
