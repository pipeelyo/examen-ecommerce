import { Module } from "@nestjs/common";
import { HealthController } from "../health.controller";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  controllers: [HealthController, OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
