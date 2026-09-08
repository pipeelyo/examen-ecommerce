import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CheckoutService, type CheckoutRequest } from "./checkout.service";

@ApiTags("orders")
@Controller("orders")
export class OrdersController {
  constructor(private readonly checkout: CheckoutService) {}

  @Post()
  create(@Body() body: CheckoutRequest) {
    return this.checkout.checkout(body);
  }
}
