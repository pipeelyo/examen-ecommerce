import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import { InternalTokenGuard } from "../common/internal-token.guard";
import { ProductsService } from "../products/products.service";

@ApiTags("categories")
@ApiHeader({ name: "X-Internal-Token", required: true })
@UseGuards(InternalTokenGuard)
@Controller("categories")
export class CategoriesController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @ApiOperation({ summary: "Categorías del catálogo (HU6 select)" })
  list() {
    return this.products.listCategories();
  }
}
