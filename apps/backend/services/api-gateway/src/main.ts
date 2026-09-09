import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle("api-gateway")
    .setDescription(
      "Único punto público. Enruta a catalog-service, coupon-service, discount-service y order-service (SDD §03, §07).",
    )
    .setVersion("1.0")
    .addApiKey({ type: "apiKey", name: "X-Admin-Token", in: "header" }, "admin-token")
    .build();
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, config));

  await app.listen(process.env.PORT || 3000, "0.0.0.0");
}

bootstrap();
