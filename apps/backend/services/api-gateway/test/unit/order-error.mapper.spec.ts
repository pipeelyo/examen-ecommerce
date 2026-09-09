import { describe, expect, it } from "vitest";
import { mapOrderServiceError } from "../../src/checkout/order-error.mapper";

describe("mapOrderServiceError", () => {
  it("404 -> NOT_FOUND", () => {
    expect(mapOrderServiceError(404, { message: "Orden no encontrada" })).toEqual({
      code: "NOT_FOUND",
      message: "Orden no encontrada",
    });
  });

  it("409 -> STOCK_INSUFFICIENT con details.productId", () => {
    expect(mapOrderServiceError(409, { message: "Stock insuficiente", productId: "p-laptop" })).toEqual({
      code: "STOCK_INSUFFICIENT",
      message: "Stock insuficiente",
      details: { productId: "p-laptop" },
    });
  });

  it("409 sin productId en el body: STOCK_INSUFFICIENT sin details", () => {
    expect(mapOrderServiceError(409, { message: "Stock insuficiente" })).toEqual({
      code: "STOCK_INSUFFICIENT",
      message: "Stock insuficiente",
    });
  });

  it("400 -> VALIDATION_ERROR", () => {
    expect(mapOrderServiceError(400, { message: "payload invalido" })).toEqual({
      code: "VALIDATION_ERROR",
      message: "payload invalido",
    });
  });

  it("503 (u otro 5xx) -> SERVICE_UNAVAILABLE", () => {
    expect(mapOrderServiceError(503, { message: "No se pudo completar el checkout", reason: "DOWNSTREAM_ERROR" })).toEqual({
      code: "SERVICE_UNAVAILABLE",
      message: "No se pudo completar el checkout",
    });
  });

  it("body sin message: usa un mensaje generico en vez de undefined", () => {
    expect(mapOrderServiceError(503, {})).toEqual({
      code: "SERVICE_UNAVAILABLE",
      message: "Error inesperado",
    });
  });
});
