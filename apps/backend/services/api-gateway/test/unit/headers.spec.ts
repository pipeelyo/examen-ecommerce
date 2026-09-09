import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { adminHeaders, internalHeaders } from "../../src/common/headers";

describe("headers", () => {
  const original = process.env.INTERNAL_SERVICE_TOKEN;

  beforeEach(() => {
    process.env.INTERNAL_SERVICE_TOKEN = "test-token";
  });

  afterEach(() => {
    process.env.INTERNAL_SERVICE_TOKEN = original;
  });

  it("internalHeaders incluye Content-Type y X-Internal-Token", () => {
    expect(internalHeaders()).toEqual({
      "Content-Type": "application/json",
      "X-Internal-Token": "test-token",
    });
  });

  it("internalHeaders permite mezclar headers extra sin perder los base", () => {
    expect(internalHeaders({ "X-User-Role": "ADMIN" })).toEqual({
      "Content-Type": "application/json",
      "X-Internal-Token": "test-token",
      "X-User-Role": "ADMIN",
    });
  });

  it("usa dev-internal-token si INTERNAL_SERVICE_TOKEN no esta definido", () => {
    delete process.env.INTERNAL_SERVICE_TOKEN;
    expect(internalHeaders()["X-Internal-Token"]).toBe("dev-internal-token");
  });

  it("adminHeaders agrega X-User-Role: ADMIN sobre los headers internos", () => {
    expect(adminHeaders()).toEqual({
      "Content-Type": "application/json",
      "X-Internal-Token": "test-token",
      "X-User-Role": "ADMIN",
    });
  });
});
