import { ExecutionContext, ForbiddenException, InternalServerErrorException } from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AdminGuard } from "../../src/common/admin.guard";

function contextWithHeaders(headers: Record<string, string | undefined>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as unknown as ExecutionContext;
}

describe("AdminGuard", () => {
  const original = process.env.ADMIN_API_TOKEN;

  beforeEach(() => {
    process.env.ADMIN_API_TOKEN = "super-secret-admin";
  });

  afterEach(() => {
    process.env.ADMIN_API_TOKEN = original;
  });

  it("permite el paso si X-Admin-Token coincide con ADMIN_API_TOKEN", () => {
    const guard = new AdminGuard();
    const ctx = contextWithHeaders({ "x-admin-token": "super-secret-admin" });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("rechaza con 403 si el token no coincide", () => {
    const guard = new AdminGuard();
    const ctx = contextWithHeaders({ "x-admin-token": "algo-incorrecto" });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it("rechaza con 403 si no se envia el header", () => {
    const guard = new AdminGuard();
    const ctx = contextWithHeaders({});

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it("falla con 500 si el gateway no tiene ADMIN_API_TOKEN configurado (error de despliegue, no del caller)", () => {
    delete process.env.ADMIN_API_TOKEN;
    const guard = new AdminGuard();
    const ctx = contextWithHeaders({ "x-admin-token": "cualquiera" });

    expect(() => guard.canActivate(ctx)).toThrow(InternalServerErrorException);
  });
});
