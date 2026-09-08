import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { NotificationsService } from "./notifications.service";
import { RedisSubscriberService } from "./redis-subscriber.service";

@Module({
  controllers: [HealthController],
  providers: [NotificationsService, RedisSubscriberService],
})
export class NotificationsModule {}
