import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationsService } from "../../src/notifications.service";

describe("NotificationsService", () => {
  let service: NotificationsService;

  beforeEach(() => {
    service = new NotificationsService();
  });

  it("evento OrderConfirmed valido: llama a sendConfirmation con el evento parseado", async () => {
    const spy = vi.spyOn(service, "sendConfirmation").mockResolvedValue(undefined);
    const raw = JSON.stringify({
      eventType: "OrderConfirmed",
      aggregateId: "order-1",
      payload: { finalTotal: 63000 },
    });

    await service.handleRawEvent(raw);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({
      eventType: "OrderConfirmed",
      aggregateId: "order-1",
      payload: { finalTotal: 63000 },
    });
  });

  it("ignora eventos de un tipo distinto a OrderConfirmed", async () => {
    const spy = vi.spyOn(service, "sendConfirmation").mockResolvedValue(undefined);
    const raw = JSON.stringify({ eventType: "OrderCancelled", aggregateId: "order-1", payload: {} });

    await service.handleRawEvent(raw);

    expect(spy).not.toHaveBeenCalled();
  });

  it("JSON invalido: no lanza excepcion y no llama a sendConfirmation", async () => {
    const spy = vi.spyOn(service, "sendConfirmation").mockResolvedValue(undefined);

    await expect(service.handleRawEvent("esto no es json")).resolves.toBeUndefined();
    expect(spy).not.toHaveBeenCalled();
  });

  it("si sendConfirmation falla, el error se contiene y no se propaga", async () => {
    vi.spyOn(service, "sendConfirmation").mockRejectedValue(new Error("proveedor caido"));
    const raw = JSON.stringify({ eventType: "OrderConfirmed", aggregateId: "order-1", payload: {} });

    await expect(service.handleRawEvent(raw)).resolves.toBeUndefined();
  });

  it("sendConfirmation resuelve sin lanzar para un evento valido", async () => {
    await expect(
      service.sendConfirmation({ eventType: "OrderConfirmed", aggregateId: "order-1", payload: {} }),
    ).resolves.toBeUndefined();
  });
});
