import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { NotificationsModule } from "./notifications.module";

async function bootstrap() {
  const app = await NestFactory.create(NotificationsModule);
  await app.listen(process.env.PORT || 3005, "0.0.0.0");
}

bootstrap();
