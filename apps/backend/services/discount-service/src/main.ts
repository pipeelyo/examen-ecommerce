import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DiscountEngineModule } from "./discount-engine.module";

async function bootstrap() {
  const app = await NestFactory.create(DiscountEngineModule);
  await app.listen(process.env.PORT || 3001, "0.0.0.0");
}

bootstrap();
