import { Module } from "@nestjs/common";
import { seedCatalog } from "./catalog";
import { CheckoutService } from "./checkout.service";
import { HealthController } from "./health.controller";
import { OrdersController } from "./orders.controller";
import { InMemoryOrderStore } from "./orders.store";
import { ProductsController } from "./products.controller";
import { QuotesController } from "./quotes.controller";

const catalog = seedCatalog();
const orders = new InMemoryOrderStore();

@Module({
  controllers: [
    HealthController,
    ProductsController,
    QuotesController,
    OrdersController,
  ],
  providers: [
    { provide: "Catalog", useValue: catalog },
    { provide: "OrderStore", useValue: orders },
    {
      provide: CheckoutService,
      useFactory: () => new CheckoutService(catalog, orders),
    },
  ],
})
export class AppModule {}
