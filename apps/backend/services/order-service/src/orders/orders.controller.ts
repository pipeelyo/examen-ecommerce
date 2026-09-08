import {
  Body,
  Controller,
  ConflictException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import { InternalTokenGuard } from "../common/internal-token.guard";
import { CheckoutRequestDto } from "./dto/checkout-request.dto";
import { OrdersService } from "./orders.service";

@ApiTags("orders")
@ApiHeader({ name: "X-Internal-Token", required: true })
@UseGuards(InternalTokenGuard)
@Controller()
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post("checkout")
  @ApiOperation({ summary: "Orquesta la saga: reservar, resolver cupon, calcular, persistir" })
  async checkout(@Body() dto: CheckoutRequestDto) {
    const result = await this.orders.checkout(dto);
    if (result.ok) {
      return result.order;
    }
    if (result.reason === "STOCK_INSUFFICIENT") {
      throw new ConflictException({
        message: "Stock insuficiente",
        productId: result.productId,
      });
    }
    throw new ServiceUnavailableException({
      message: "No se pudo completar el checkout",
      reason: result.reason,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Consulta una orden persistida" })
  async findById(@Param("id", new ParseUUIDPipe()) id: string) {
    const order = await this.orders.findById(id);
    if (!order) {
      throw new NotFoundException("Orden no encontrada");
    }
    return order;
  }
}
