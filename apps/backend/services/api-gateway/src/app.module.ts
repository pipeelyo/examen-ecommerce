import { Module } from "@nestjs/common";
import { CheckoutController } from "./checkout/checkout.controller";
import { CouponsController } from "./coupons/coupons.controller";
import { HealthController } from "./health.controller";
import { ProductsController } from "./products/products.controller";
import { StatusController } from "./status/status.controller";

@Module({
  controllers: [
    HealthController,
    StatusController,
    ProductsController,
    CouponsController,
    CheckoutController,
  ],
})
export class AppModule {}
