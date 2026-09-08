import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import { InternalTokenGuard } from "../common/internal-token.guard";
import { StockItemsDto } from "./dto/stock-items.dto";
import { StockService } from "./stock.service";

@ApiTags("stock")
@ApiHeader({ name: "X-Internal-Token", required: true })
@UseGuards(InternalTokenGuard)
@Controller("internal/stock")
export class StockController {
  constructor(private readonly stock: StockService) {}

  @Post("reserve")
  @ApiOperation({ summary: "Saga paso 1: reserva atómica de stock" })
  reserve(@Body() dto: StockItemsDto) {
    return this.stock.reserveStock(dto.items);
  }

  @Post("release")
  @ApiOperation({ summary: "Compensación de saga: libera stock reservado" })
  release(@Body() dto: StockItemsDto) {
    return this.stock.releaseStock(dto.items);
  }
}
