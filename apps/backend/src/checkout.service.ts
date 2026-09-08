import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import {
  ACTIVE_COUPON,
  quote,
  type CartLine,
} from "@examen/discount-engine";
import type { Catalog } from "./catalog";
import type { Order, OrderStore } from "./orders.store";

export type CheckoutLine = {
  productId: string;
  quantity: number;
};

export type CheckoutRequest = {
  lines: CheckoutLine[];
  couponCode?: string;
};

@Injectable()
export class CheckoutService {
  constructor(
    private readonly catalog: Catalog,
    private readonly orders: OrderStore,
  ) {}

  products() {
    return this.catalog.list();
  }

  preview(request: CheckoutRequest) {
    return this.buildQuote(request);
  }

  checkout(request: CheckoutRequest): Order {
    const quoted = this.buildQuote(request);
    for (const line of quoted.lines) {
      const product = this.catalog.get(line.productId);
      if (!product || product.stock < line.quantity) {
        throw new ConflictException(`Stock insuficiente para ${line.productId}`);
      }
    }
    for (const line of quoted.lines) {
      this.catalog.decrement(line.productId, line.quantity);
    }
    const order: Order = {
      ...quoted,
      orderId: `ord-${Date.now()}`,
    };
    this.orders.save(order);
    return order;
  }

  private buildQuote(request: CheckoutRequest) {
    if (!request.lines?.length) {
      throw new BadRequestException("El carrito está vacío");
    }

    const coupon = request.couponCode?.trim() || "";
    if (coupon && coupon !== ACTIVE_COUPON) {
      throw new BadRequestException("Cupón inválido");
    }

    const lines: CartLine[] = request.lines.map((item) => {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new BadRequestException("Cantidad inválida");
      }
      const product = this.catalog.get(item.productId);
      if (!product) {
        throw new BadRequestException(`Producto ${item.productId} no existe`);
      }
      return {
        productId: product.id,
        name: product.name,
        unitPrice: product.unitPrice,
        category: product.category,
        quantity: item.quantity,
      };
    });

    return {
      ...quote(lines, coupon || null),
      lines,
      couponCode: coupon || null,
    };
  }
}
