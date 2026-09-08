import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { OrdersModule } from "./orders/orders.module";
import { OrdersRepository } from "./orders/orders.repository";
import { OutboxRelay } from "./outbox/outbox-relay";
import { RedisEventPublisher } from "./outbox/redis-publisher";

async function bootstrap() {
  const app = await NestFactory.create(OrdersModule);

  const relay = new OutboxRelay(
    new OrdersRepository(),
    new RedisEventPublisher(process.env.REDIS_URL ?? "redis://redis:6379"),
  );
  relay.start();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle("order-service")
    .setDescription(
      "Orquesta la saga de checkout: catalog-service, coupon-service y discount-service (SDD §09).",
    )
    .setVersion("1.0")
    .addApiKey(
      { type: "apiKey", name: "X-Internal-Token", in: "header" },
      "internal-token",
    )
    .build();
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, config));

  await app.listen(process.env.PORT || 3004, "0.0.0.0");
}

bootstrap();
