import { Module } from "@nestjs/common";
import { DiscountEngineController } from "./discount-engine.controller";
import { DiscountEngineService } from "./discount-engine.service";
import { HealthController } from "./health.controller";

@Module({
  controllers: [HealthController, DiscountEngineController],
  providers: [DiscountEngineService],
})
export class DiscountEngineModule {}
