import type { ApiErrorDto } from "../common/api-error.filter";

function messageFrom(body: unknown, fallback: string): string {
  if (typeof body === "object" && body !== null && "message" in body) {
    return String((body as { message: unknown }).message);
  }
  return fallback;
}

/**
 * order-service no es parte del CONTRACT.md publico — sus respuestas de
 * error (ConflictException/ServiceUnavailableException/NotFoundException
 * "crudas" de Nest) llegan al gateway via forward()/fetch, no como
 * excepciones lanzadas dentro del propio gateway, asi que ApiErrorFilter
 * nunca las ve. Esta funcion hace la misma traduccion a ApiErrorDto para
 * el unico tramo que las reenvia (checkout.controller.ts).
 */
export function mapOrderServiceError(status: number, body: unknown): ApiErrorDto {
  const message = messageFrom(body, "Error inesperado");

  if (status === 404) {
    return { code: "NOT_FOUND", message };
  }
  if (status === 409) {
    const productId = typeof body === "object" && body !== null && "productId" in body ? (body as { productId: unknown }).productId : undefined;
    return { code: "STOCK_INSUFFICIENT", message, ...(productId !== undefined ? { details: { productId } } : {}) };
  }
  if (status === 400) {
    return { code: "VALIDATION_ERROR", message };
  }
  return { code: "SERVICE_UNAVAILABLE", message };
}
