import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { CatalogModule } from "./catalog.module";

async function bootstrap() {
  const app = await NestFactory.create(CatalogModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle("catalog-service")
    .setDescription(
      "Dueño de products y categories. HU1 catálogo, HU6 admin, reserva/liberación de stock (SDD §01, §06, §09).",
    )
    .setVersion("1.0")
    .addApiKey(
      { type: "apiKey", name: "X-Internal-Token", in: "header" },
      "internal-token",
    )
    .build();
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, config));

  await app.listen(process.env.PORT || 3002, "0.0.0.0");
}

bootstrap();
