import { Injectable } from "@nestjs/common";
import { HttpCatalogClient } from "../clients/http-catalog.client";
import { HttpCouponClient } from "../clients/http-coupon.client";
import { HttpDiscountClient } from "../clients/http-discount.client";
import { CheckoutSaga, type CheckoutInput, type CheckoutResult } from "./checkout.saga";
import { OrdersRepository } from "./orders.repository";

@Injectable()
export class OrdersService {
  private readonly saga: CheckoutSaga;
  private readonly repository = new OrdersRepository();

  constructor() {
    const token = process.env.INTERNAL_SERVICE_TOKEN ?? "dev-internal-token";
    this.saga = new CheckoutSaga(
      new HttpCatalogClient(
        process.env.CATALOG_SERVICE_URL ?? "http://catalog-service:3002",
        token,
      ),
      new HttpCouponClient(
        process.env.COUPON_SERVICE_URL ?? "http://coupon-service:3003",
        token,
      ),
      new HttpDiscountClient(
        process.env.DISCOUNT_SERVICE_URL ?? "http://discount-service:3001",
        token,
      ),
      this.repository,
    );
  }

  checkout(input: CheckoutInput): Promise<CheckoutResult> {
    return this.saga.run(input);
  }

  findById(id: string) {
    return this.repository.findById(id);
  }
}
