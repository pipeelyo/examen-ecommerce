import { Controller, Get } from "@nestjs/common";
import { pingHealth } from "../common/downstream";

const SERVICES: Record<string, string> = {
  "catalog-service": process.env.CATALOG_SERVICE_URL ?? "http://catalog-service:3002",
  "coupon-service": process.env.COUPON_SERVICE_URL ?? "http://coupon-service:3003",
  "discount-service": process.env.DISCOUNT_SERVICE_URL ?? "http://discount-service:3001",
  "order-service": process.env.ORDER_SERVICE_URL ?? "http://order-service:3004",
};

@Controller("status")
export class StatusController {
  @Get()
  async status() {
    const entries = await Promise.all(
      Object.entries(SERVICES).map(async ([name, url]) => [name, await pingHealth(url)] as const),
    );
    return Object.fromEntries(entries);
  }
}
