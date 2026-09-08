import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { NotificationsService } from "./notifications.service";

const CHANNEL = "order.events";

@Injectable()
export class RedisSubscriberService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisSubscriberService.name);
  private client?: Redis;

  constructor(private readonly notifications: NotificationsService) {}

  async onModuleInit(): Promise<void> {
    this.client = new Redis(process.env.REDIS_URL ?? "redis://redis:6379");
    await this.client.subscribe(CHANNEL);
    this.client.on("message", (_channel: string, message: string) => {
      void this.notifications.handleRawEvent(message);
    });
    this.logger.log(`suscrito al canal ${CHANNEL}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit();
  }
}
