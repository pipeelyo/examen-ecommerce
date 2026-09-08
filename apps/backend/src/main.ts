import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.enableCors({ origin: true });

  const swagger = new DocumentBuilder()
    .setTitle("examen-ecommerce")
    .setDescription("Checkout con descuentos acumulativos")
    .setVersion("1")
    .build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, swagger), {
    useGlobalPrefix: true,
  });

  await app.listen(process.env.PORT || 3000, "0.0.0.0");
}

bootstrap();
