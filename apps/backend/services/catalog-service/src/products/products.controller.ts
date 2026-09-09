import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { InternalTokenGuard } from "../common/internal-token.guard";
import { RolesGuard } from "../common/roles.guard";
import { AdjustStockDto } from "./dto/adjust-stock.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductsService } from "./products.service";

@ApiTags("products")
@ApiHeader({ name: "X-Internal-Token", required: true })
@UseGuards(InternalTokenGuard)
@Controller()
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get("products")
  @ApiOperation({ summary: "Catálogo activo (HU1)" })
  @ApiResponse({ status: 200 })
  list() {
    return this.products.list();
  }

  @Get("products/:id")
  @ApiOperation({
    summary: "Producto por id, incluso si está inactivo (soft delete)",
  })
  getById(@Param("id") id: string) {
    return this.products.getById(id);
  }

  @Post("admin/products")
  @UseGuards(RolesGuard)
  @ApiHeader({ name: "X-User-Role", required: true, description: "ADMIN" })
  @ApiOperation({ summary: "Crear producto (HU6)" })
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Patch("admin/products/:id")
  @UseGuards(RolesGuard)
  @ApiHeader({ name: "X-User-Role", required: true, description: "ADMIN" })
  @ApiOperation({ summary: "Editar nombre/precio/categoría, sin tocar stock" })
  update(
    @Param("id") id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.update(id, dto);
  }

  @Patch("admin/products/:id/stock")
  @UseGuards(RolesGuard)
  @ApiHeader({ name: "X-User-Role", required: true, description: "ADMIN" })
  @ApiOperation({ summary: "Ajuste atómico de stock { delta }" })
  adjustStock(
    @Param("id") id: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.products.adjustStock(id, dto.delta);
  }

  @Delete("admin/products/:id")
  @UseGuards(RolesGuard)
  @ApiHeader({ name: "X-User-Role", required: true, description: "ADMIN" })
  @ApiOperation({ summary: "Soft delete (active=false)" })
  softDelete(@Param("id") id: string) {
    return this.products.softDelete(id);
  }
}
