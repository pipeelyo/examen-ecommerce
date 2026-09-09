import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { BearerAuthGuard } from "../../src/common/bearer-auth.guard";

function contextWithHeaders(headers: Record<string, string | undefined>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as unknown as ExecutionContext;
}

describe("BearerAuthGuard", () => {
  it("permite el paso con un Bearer token no vacio", () => {
    const guard = new BearerAuthGuard();
    const ctx = contextWithHeaders({ authorization: "Bearer demo" });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("rechaza con 401 si no hay header Authorization", () => {
    const guard = new BearerAuthGuard();
    const ctx = contextWithHeaders({});

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it("rechaza con 401 si el Bearer viene vacio", () => {
    const guard = new BearerAuthGuard();
    const ctx = contextWithHeaders({ authorization: "Bearer " });

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it("rechaza con 401 si el header no usa el esquema Bearer", () => {
    const guard = new BearerAuthGuard();
    const ctx = contextWithHeaders({ authorization: "Basic dXNlcjpwYXNz" });

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});
