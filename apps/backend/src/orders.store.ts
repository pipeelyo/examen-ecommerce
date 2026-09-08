import type { CartLine, Quote } from "@examen/discount-engine";

export type Order = Quote & {
  orderId: string;
  lines: CartLine[];
  couponCode: string | null;
};

export interface OrderStore {
  save(order: Order): void;
  get(orderId: string): Order | undefined;
}

export class InMemoryOrderStore implements OrderStore {
  private readonly orders = new Map<string, Order>();

  save(order: Order): void {
    this.orders.set(order.orderId, order);
  }

  get(orderId: string): Order | undefined {
    return this.orders.get(orderId);
  }
}
