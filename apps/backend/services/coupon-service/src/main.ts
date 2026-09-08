import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { CouponsModule } from "./coupons.module";

async function bootstrap() {
  const app = await NestFactory.create(CouponsModule);
  await app.listen(process.env.PORT || 3003, "0.0.0.0");
}

bootstrap();
