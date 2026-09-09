import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import type { Response } from "express";

export interface ApiErrorDto {
  code: string;
  message: string;
  fields?: string[];
  details?: Record<string, unknown>;
}

function isApiErrorShape(body: unknown): body is ApiErrorDto {
  return typeof body === "object" && body !== null && "code" in body && "message" in body;
}

function messageOf(body: unknown, fallback: string): unknown {
  if (typeof body === "object" && body !== null && "message" in body) {
    return (body as { message: unknown }).message;
  }
  return fallback;
}

function fallbackCodeFor(status: number): string {
  if (status === 404) return "NOT_FOUND";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 422) return "CART_EMPTY";
  if (status >= 500) return "SERVICE_UNAVAILABLE";
  return "VALIDATION_ERROR";
}

/**
 * Traduce cualquier excepcion de Nest (incluida la del ValidationPipe global)
 * al shape ApiErrorDto {code,message,fields?,details?} que exige el
 * CONTRACT.md del front. Si el body ya trae `code` (porque el propio guard/
 * controller lo lanzo asi), se respeta tal cual.
 */
@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();

    if (!(exception instanceof HttpException)) {
      res.status(503).json({ code: "SERVICE_UNAVAILABLE", message: "Error interno" });
      return;
    }

    const status = exception.getStatus();
    const body = exception.getResponse();

    if (isApiErrorShape(body)) {
      res.status(status).json(body);
      return;
    }

    if (status === 400) {
      const message = messageOf(body, exception.message);
      res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Payload inválido",
        fields: Array.isArray(message) ? message.map(String) : [String(message)],
      });
      return;
    }

    res.status(status).json({ code: fallbackCodeFor(status), message: String(messageOf(body, exception.message)) });
  }
}
