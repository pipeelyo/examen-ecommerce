import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { ApiErrorFilter } from "../../src/common/api-error.filter";

function mockHost() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: unknown) {
      res.body = body;
      return res;
    },
  };
  vi.spyOn(res, "status");
  vi.spyOn(res, "json");
  const host = { switchToHttp: () => ({ getResponse: () => res }) } as unknown as ArgumentsHost;
  return { host, res };
}

describe("ApiErrorFilter", () => {
  it("respeta el body si ya viene con forma ApiErrorDto (guards propios)", () => {
    const filter = new ApiErrorFilter();
    const { host, res } = mockHost();

    filter.catch(new UnauthorizedException({ code: "UNAUTHORIZED", message: "Falta token Bearer" }), host);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ code: "UNAUTHORIZED", message: "Falta token Bearer" });
  });

  it("mapea un 400 del ValidationPipe (message es array) a VALIDATION_ERROR con fields", () => {
    const filter = new ApiErrorFilter();
    const { host, res } = mockHost();

    filter.catch(new BadRequestException(["items debe ser un array", "quantity debe ser >= 1"]), host);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      code: "VALIDATION_ERROR",
      message: "Payload inválido",
      fields: ["items debe ser un array", "quantity debe ser >= 1"],
    });
  });

  it("mapea un 404 generico de Nest (sin code propio) a NOT_FOUND", () => {
    const filter = new ApiErrorFilter();
    const { host, res } = mockHost();

    filter.catch(new NotFoundException("Producto no encontrado"), host);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ code: "NOT_FOUND", message: "Producto no encontrado" });
  });

  it("mapea un 422 generico a CART_EMPTY (unico caso 422 del contrato)", () => {
    const filter = new ApiErrorFilter();
    const { host, res } = mockHost();

    filter.catch(new UnprocessableEntityException("El carrito está vacío"), host);

    expect(res.statusCode).toBe(422);
    expect(res.body).toEqual({ code: "CART_EMPTY", message: "El carrito está vacío" });
  });

  it("mapea un 503 generico a SERVICE_UNAVAILABLE", () => {
    const filter = new ApiErrorFilter();
    const { host, res } = mockHost();

    filter.catch(new ServiceUnavailableException("Servicio caido"), host);

    expect(res.statusCode).toBe(503);
    expect(res.body).toEqual({ code: "SERVICE_UNAVAILABLE", message: "Servicio caido" });
  });

  it("un status sin mapeo especifico (ni 404/401/422/5xx) cae en VALIDATION_ERROR por defecto", () => {
    const filter = new ApiErrorFilter();
    const { host, res } = mockHost();

    filter.catch(new HttpException("teapot", 418), host);

    expect(res.statusCode).toBe(418);
    expect(res.body).toEqual({ code: "VALIDATION_ERROR", message: "teapot" });
  });

  it("una excepcion no-Http (bug interno) responde 503 SERVICE_UNAVAILABLE sin filtrar detalles", () => {
    const filter = new ApiErrorFilter();
    const { host, res } = mockHost();

    filter.catch(new Error("stack trace sensible"), host);

    expect(res.statusCode).toBe(503);
    expect(res.body).toEqual({ code: "SERVICE_UNAVAILABLE", message: "Error interno" });
  });
});
