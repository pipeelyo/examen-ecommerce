import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CheckoutService, type CheckoutRequest } from "./checkout.service";

@ApiTags("quotes")
@Controller("quotes")
export class QuotesController {
  constructor(private readonly checkout: CheckoutService) {}

  @Post()
  preview(@Body() body: CheckoutRequest) {
    return this.checkout.preview(body);
  }
}
