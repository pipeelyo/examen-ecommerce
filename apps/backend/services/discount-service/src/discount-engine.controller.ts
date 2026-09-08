import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import {
  DiscountEngineService,
  type CalculateInput,
} from "./discount-engine.service";
import { InternalTokenGuard } from "./internal-token.guard";

@Controller("internal/discounts")
export class DiscountEngineController {
  constructor(private readonly engine: DiscountEngineService) {}

  @Post("calculate")
  @UseGuards(InternalTokenGuard)
  calculate(@Body() body: CalculateInput) {
    return this.engine.calculate(body);
  }
}
