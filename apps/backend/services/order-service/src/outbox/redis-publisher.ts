import Redis from "ioredis";
import type { EventPublisher } from "./outbox-relay";

export class RedisEventPublisher implements EventPublisher {
  private readonly client: Redis;

  constructor(url: string) {
    this.client = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 2 });
  }

  async publish(channel: string, message: string): Promise<void> {
    await this.client.publish(channel, message);
  }
}
