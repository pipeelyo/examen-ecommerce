import { Module } from "@nestjs/common";
import { CategoriesController } from "./categories/categories.controller";
import { HealthController } from "./health.controller";
import { PrismaService } from "./prisma.service";
import { ProductsController } from "./products/products.controller";
import { ProductsRepository } from "./products/products.repository";
import { ProductsService } from "./products/products.service";
import { StockController } from "./stock/stock.controller";
import { StockService } from "./stock/stock.service";

@Module({
  controllers: [
    HealthController,
    ProductsController,
    CategoriesController,
    StockController,
  ],
  providers: [PrismaService, ProductsRepository, ProductsService, StockService],
})
export class CatalogModule {}
