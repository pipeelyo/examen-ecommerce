import { describe, expect, it, vi } from "vitest";
import { OutboxRelay, type EventPublisher, type OutboxSource } from "../../src/outbox/outbox-relay";

function fakeSource(overrides: Partial<OutboxSource> = {}): OutboxSource {
  return {
    findPendingOutboxEvents: vi.fn().mockResolvedValue([]),
    markOutboxEventPublished: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function fakePublisher(overrides: Partial<EventPublisher> = {}): EventPublisher {
  return {
    publish: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

const EVENT_1 = { id: "evt-1", eventType: "OrderConfirmed", aggregateId: "order-1", payload: { finalTotal: 1000 } };
const EVENT_2 = { id: "evt-2", eventType: "OrderConfirmed", aggregateId: "order-2", payload: { finalTotal: 2000 } };

describe("OutboxRelay", () => {
  it("sin eventos pendientes: no publica ni marca nada", async () => {
    const source = fakeSource();
    const publisher = fakePublisher();
    const relay = new OutboxRelay(source, publisher);

    const result = await relay.tick();

    expect(result).toEqual({ published: 0, failed: 0 });
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it("publica cada evento pendiente y lo marca como publicado", async () => {
    const source = fakeSource({
      findPendingOutboxEvents: vi.fn().mockResolvedValue([EVENT_1, EVENT_2]),
    });
    const publisher = fakePublisher();
    const relay = new OutboxRelay(source, publisher);

    const result = await relay.tick();

    expect(result).toEqual({ published: 2, failed: 0 });
    expect(publisher.publish).toHaveBeenNthCalledWith(
      1,
      "order.events",
      JSON.stringify({ eventType: "OrderConfirmed", aggregateId: "order-1", payload: { finalTotal: 1000 } }),
    );
    expect(source.markOutboxEventPublished).toHaveBeenCalledWith("evt-1");
    expect(source.markOutboxEventPublished).toHaveBeenCalledWith("evt-2");
  });

  it("si publicar falla para un evento, no lo marca publicado pero sigue con los demas", async () => {
    const source = fakeSource({
      findPendingOutboxEvents: vi.fn().mockResolvedValue([EVENT_1, EVENT_2]),
    });
    const publisher = fakePublisher({
      publish: vi
        .fn()
        .mockRejectedValueOnce(new Error("redis caido"))
        .mockResolvedValueOnce(undefined),
    });
    const relay = new OutboxRelay(source, publisher);

    const result = await relay.tick();

    expect(result).toEqual({ published: 1, failed: 1 });
    expect(source.markOutboxEventPublished).not.toHaveBeenCalledWith("evt-1");
    expect(source.markOutboxEventPublished).toHaveBeenCalledWith("evt-2");
  });

  it("respeta el tamaño de lote pasado a tick", async () => {
    const source = fakeSource();
    const publisher = fakePublisher();
    const relay = new OutboxRelay(source, publisher);

    await relay.tick(5);

    expect(source.findPendingOutboxEvents).toHaveBeenCalledWith(5);
  });

  it("usa el canal por defecto order.events, o el canal custom si se pasa", async () => {
    const source = fakeSource({ findPendingOutboxEvents: vi.fn().mockResolvedValue([EVENT_1]) });
    const publisher = fakePublisher();
    const relay = new OutboxRelay(source, publisher, "custom.channel");

    await relay.tick();

    expect(publisher.publish).toHaveBeenCalledWith("custom.channel", expect.any(String));
  });

  it("start() programa tick() en el intervalo indicado", async () => {
    vi.useFakeTimers();
    try {
      const source = fakeSource({ findPendingOutboxEvents: vi.fn().mockResolvedValue([EVENT_1]) });
      const publisher = fakePublisher();
      const relay = new OutboxRelay(source, publisher);

      const handle = relay.start(1000);
      await vi.advanceTimersByTimeAsync(1000);

      expect(source.findPendingOutboxEvents).toHaveBeenCalledTimes(1);
      clearInterval(handle);
    } finally {
      vi.useRealTimers();
    }
  });

  it("start() no deja escapar el error si tick() falla", async () => {
    vi.useFakeTimers();
    try {
      const source = fakeSource({
        findPendingOutboxEvents: vi.fn().mockRejectedValue(new Error("db caida")),
      });
      const publisher = fakePublisher();
      const relay = new OutboxRelay(source, publisher);

      const handle = relay.start(1000);
      await vi.advanceTimersByTimeAsync(1000);

      clearInterval(handle);
    } finally {
      vi.useRealTimers();
    }
  });
});
