import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const jwtVerify = vi.fn();
vi.mock("jose", () => ({
  createRemoteJWKSet: vi.fn(() => "jwks-marker"),
  jwtVerify: (...args: unknown[]) => jwtVerify(...args),
}));

function contextWithHeaders(headers: Record<string, string | undefined>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as unknown as ExecutionContext;
}

describe("BearerAuthGuard", () => {
  const originalSupabaseUrl = process.env.SUPABASE_URL;

  beforeEach(() => {
    jwtVerify.mockReset();
  });

  afterEach(() => {
    process.env.SUPABASE_URL = originalSupabaseUrl;
  });

  it("permite el paso con el token demo literal (CONTRACT.md)", async () => {
    const { BearerAuthGuard } = await import("../../src/common/bearer-auth.guard");
    const guard = new BearerAuthGuard();
    const ctx = contextWithHeaders({ authorization: "Bearer demo" });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(jwtVerify).not.toHaveBeenCalled();
  });

  it("rechaza con 401 si no hay header Authorization", async () => {
    const { BearerAuthGuard } = await import("../../src/common/bearer-auth.guard");
    const guard = new BearerAuthGuard();
    const ctx = contextWithHeaders({});

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rechaza con 401 si el Bearer viene vacio", async () => {
    const { BearerAuthGuard } = await import("../../src/common/bearer-auth.guard");
    const guard = new BearerAuthGuard();
    const ctx = contextWithHeaders({ authorization: "Bearer " });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rechaza con 401 si el header no usa el esquema Bearer", async () => {
    const { BearerAuthGuard } = await import("../../src/common/bearer-auth.guard");
    const guard = new BearerAuthGuard();
    const ctx = contextWithHeaders({ authorization: "Basic dXNlcjpwYXNz" });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("permite el paso con un JWT real de Supabase (login con Google) si la firma verifica", async () => {
    process.env.SUPABASE_URL = "https://cgnqftclzhgjlzollzye.supabase.co";
    jwtVerify.mockResolvedValueOnce({ payload: { sub: "user-1" } });
    const { BearerAuthGuard } = await import("../../src/common/bearer-auth.guard");
    const guard = new BearerAuthGuard();
    const ctx = contextWithHeaders({ authorization: "Bearer eyJ.real.jwt" });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(jwtVerify).toHaveBeenCalledWith("eyJ.real.jwt", "jwks-marker");
  });

  it("rechaza con 401 si el JWT no verifica (firma invalida o expirado)", async () => {
    process.env.SUPABASE_URL = "https://cgnqftclzhgjlzollzye.supabase.co";
    jwtVerify.mockRejectedValueOnce(new Error("signature verification failed"));
    const { BearerAuthGuard } = await import("../../src/common/bearer-auth.guard");
    const guard = new BearerAuthGuard();
    const ctx = contextWithHeaders({ authorization: "Bearer eyJ.invalido.jwt" });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rechaza con 401 un token no-demo si el gateway no tiene SUPABASE_URL configurado", async () => {
    delete process.env.SUPABASE_URL;
    const { BearerAuthGuard } = await import("../../src/common/bearer-auth.guard");
    const guard = new BearerAuthGuard();
    const ctx = contextWithHeaders({ authorization: "Bearer eyJ.algo.jwt" });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwtVerify).not.toHaveBeenCalled();
  });
});
