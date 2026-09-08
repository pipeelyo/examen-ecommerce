import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { CheckoutService } from "./checkout.service";

@ApiTags("products")
@Controller("products")
export class ProductsController {
  constructor(private readonly checkout: CheckoutService) {}

  @Get()
  @ApiOkResponse({ description: "Catálogo con stock en memoria" })
  list() {
    return this.checkout.products();
  }
}
