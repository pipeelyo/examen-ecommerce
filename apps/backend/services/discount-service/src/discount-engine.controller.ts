import { Body, Controller, Inject, Post, UseGuards } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CalculateDiscountsDto } from "./calculate-discounts.dto";
import { DiscountEngineService } from "./discount-engine.service";
import { InternalTokenGuard } from "./internal-token.guard";

@ApiTags("discounts")
@ApiHeader({ name: "X-Internal-Token", required: true })
@Controller("internal/discounts")
export class DiscountEngineController {
  constructor(
    @Inject(DiscountEngineService)
    private readonly engine: DiscountEngineService,
  ) {}

  @Post("calculate")
  @UseGuards(InternalTokenGuard)
  @ApiOperation({ summary: "Cascada Categoría → Volumen → Cupón + tope 35%" })
  calculate(@Body() body: CalculateDiscountsDto) {
    return this.engine.calculate(body);
  }
}
