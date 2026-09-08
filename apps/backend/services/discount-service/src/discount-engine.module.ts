import { Module } from "@nestjs/common";
import { DiscountEngineController } from "./discount-engine.controller";
import { DiscountEngineService } from "./discount-engine.service";

@Module({
  controllers: [DiscountEngineController],
  providers: [DiscountEngineService],
})
export class DiscountEngineModule {}
