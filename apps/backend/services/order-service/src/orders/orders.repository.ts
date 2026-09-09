import { PrismaClient } from "@prisma/client";
import type { CheckoutBreakdown } from "../clients/discount.client";

export interface OrderLineSnapshot {
  productId: string;
  category: string;
  quantity: number;
  unitPriceSnapshot: number;
  lineDiscountAmount: number;
}

export interface GuestInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
}

export interface CreateOrderInput {
  userId: string | null;
  guestInfo?: GuestInfo;
  customerEmail?: string | null;
  couponCode?: string | null;
  breakdown: CheckoutBreakdown;
  lines: OrderLineSnapshot[];
}

export interface PersistedOrder {
  id: string;
  status: string;
  finalTotal: number;
  createdAt: Date;
}

export interface OutboxEventRecord {
  id: string;
  eventType: string;
  aggregateId: string;
  payload: unknown;
}

const prisma = new PrismaClient();

export class OrdersRepository {
  async createOrder(input: CreateOrderInput): Promise<PersistedOrder> {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: input.userId,
          guestFullName: input.guestInfo?.fullName,
          guestEmail: input.guestInfo?.email,
          guestPhone: input.guestInfo?.phone,
          guestAddress: input.guestInfo?.address,
          customerEmail: input.customerEmail ?? input.guestInfo?.email ?? null,
          couponCode: input.couponCode ?? null,
          originalSubtotal: input.breakdown.originalSubtotal,
          categoryDiscountAmount: input.breakdown.breakdown.category.amount,
          volumeDiscountAmount: input.breakdown.breakdown.volume.amount,
          couponDiscountAmount: input.breakdown.breakdown.coupon.amount,
          discountCapped: input.breakdown.breakdown.cappedAt35,
          finalTotal: input.breakdown.finalTotal,
          status: "CONFIRMED",
          items: {
            create: input.lines.map((line) => ({
              productId: line.productId,
              categorySnapshot: line.category,
              unitPriceSnapshot: line.unitPriceSnapshot,
              quantity: line.quantity,
              lineDiscountAmount: line.lineDiscountAmount,
            })),
          },
        },
      });

      await tx.outboxEvent.create({
        data: {
          aggregateType: "Order",
          aggregateId: order.id,
          eventType: "OrderConfirmed",
          payload: {
            orderId: order.id,
            finalTotal: input.breakdown.finalTotal,
            itemCount: input.lines.length,
          },
          status: "PENDING",
        },
      });

      return {
        id: order.id,
        status: order.status,
        finalTotal: order.finalTotal,
        createdAt: order.createdAt,
      };
    });
  }

  /**
   * HU7 (canje unico): un mismo cliente no puede aplicar el mismo cupon en
   * mas de una orden confirmada. Solo existen filas en `orders` para
   * checkouts que ya completaron la saga completa (ver CheckoutSaga.run),
   * asi que basta con buscar una coincidencia — no hace falta filtrar por
   * status.
   */
  async hasRedeemedCoupon(customerEmail: string, couponCode: string): Promise<boolean> {
    const existing = await prisma.order.findFirst({
      where: { customerEmail, couponCode },
      select: { id: true },
    });
    return existing !== null;
  }

  async findById(id: string) {
    return prisma.order.findUnique({ where: { id }, include: { items: true } });
  }

  async findPendingOutboxEvents(limit: number): Promise<OutboxEventRecord[]> {
    const rows = await prisma.outboxEvent.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
    return rows.map((row) => ({
      id: row.id,
      eventType: row.eventType,
      aggregateId: row.aggregateId,
      payload: row.payload,
    }));
  }

  async markOutboxEventPublished(id: string): Promise<void> {
    await prisma.outboxEvent.update({ where: { id }, data: { status: "PUBLISHED" } });
  }
}
