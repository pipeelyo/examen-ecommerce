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
  breakdown: CheckoutBreakdown;
  lines: OrderLineSnapshot[];
}

export interface PersistedOrder {
  id: string;
  status: string;
  finalTotal: number;
  createdAt: Date;
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

  async findById(id: string) {
    return prisma.order.findUnique({ where: { id }, include: { items: true } });
  }
}
