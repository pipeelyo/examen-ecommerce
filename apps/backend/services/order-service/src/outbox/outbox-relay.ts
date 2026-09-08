export interface OutboxEventRecord {
  id: string;
  eventType: string;
  aggregateId: string;
  payload: unknown;
}

export interface OutboxSource {
  findPendingOutboxEvents(limit: number): Promise<OutboxEventRecord[]>;
  markOutboxEventPublished(id: string): Promise<void>;
}

export interface EventPublisher {
  publish(channel: string, message: string): Promise<void>;
}

export interface RelayTickResult {
  published: number;
  failed: number;
}

/**
 * Lee outbox_events en estado PENDING y las publica en Redis Pub/Sub (SDD §09).
 * Un evento que falla al publicar se queda PENDING (no se marca) para que el
 * siguiente tick lo reintente — nunca se pierde silenciosamente, solo se
 * retrasa. Corre dentro del propio order-service, no es un proceso aparte.
 */
export class OutboxRelay {
  constructor(
    private readonly source: OutboxSource,
    private readonly publisher: EventPublisher,
    private readonly channel: string = "order.events",
  ) {}

  async tick(batchSize = 20): Promise<RelayTickResult> {
    const pending = await this.source.findPendingOutboxEvents(batchSize);
    let published = 0;
    let failed = 0;

    for (const event of pending) {
      try {
        await this.publisher.publish(
          this.channel,
          JSON.stringify({
            eventType: event.eventType,
            aggregateId: event.aggregateId,
            payload: event.payload,
          }),
        );
        await this.source.markOutboxEventPublished(event.id);
        published++;
      } catch {
        failed++;
      }
    }

    return { published, failed };
  }

  start(intervalMs = 2000): NodeJS.Timeout {
    return setInterval(() => {
      this.tick().catch((err) => {
        // eslint-disable-next-line no-console
        console.error("outbox-relay: tick fallo", err);
      });
    }, intervalMs);
  }
}
