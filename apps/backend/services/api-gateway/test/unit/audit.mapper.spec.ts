import { describe, expect, it } from "vitest";
import { parseLimit, toAuditEventDto } from "../../src/audit/audit.mapper";
import type { RawAuditRow } from "../../src/audit/audit-events.repository";

function row(overrides: Partial<RawAuditRow> = {}): RawAuditRow {
  return {
    id: 1,
    entity_name: "products",
    operation: "UPDATE",
    row_pk: "p-silla",
    actor: null,
    old_data: { stock: 9 },
    new_data: { stock: 12 },
    occurred_at: new Date("2026-09-09T03:55:50.057Z"),
    ...overrides,
  };
}

describe("toAuditEventDto", () => {
  it("convierte occurred_at (Date) a ISO string", () => {
    const dto = toAuditEventDto(row());
    expect(dto.occurred_at).toBe("2026-09-09T03:55:50.057Z");
  });

  it("castea id a number: pg devuelve BIGSERIAL como string", () => {
    const raw = { ...row(), id: "56" } as unknown as RawAuditRow;
    const dto = toAuditEventDto(raw);
    expect(dto.id).toBe(56);
    expect(typeof dto.id).toBe("number");
  });

  it("no incluye hmac_signature aunque el row original la traiga", () => {
    const withHmac = { ...row(), hmac_signature: "abc123" } as RawAuditRow & { hmac_signature: string };
    const dto = toAuditEventDto(withHmac);
    expect(dto).not.toHaveProperty("hmac_signature");
  });

  it("preserva actor null, old_data y new_data tal cual", () => {
    const dto = toAuditEventDto(row({ actor: "admin@norte.shop" }));
    expect(dto.actor).toBe("admin@norte.shop");
    expect(dto.old_data).toEqual({ stock: 9 });
    expect(dto.new_data).toEqual({ stock: 12 });
  });
});

describe("parseLimit", () => {
  it("usa el fallback si no se pasa limit", () => {
    expect(parseLimit(undefined, 100)).toBe(100);
  });

  it("usa el fallback si el valor no es un numero valido", () => {
    expect(parseLimit("abc", 100)).toBe(100);
  });

  it("usa el fallback si el valor es 0 o negativo", () => {
    expect(parseLimit("0", 100)).toBe(100);
    expect(parseLimit("-5", 100)).toBe(100);
  });

  it("trunca decimales", () => {
    expect(parseLimit("12.9", 100)).toBe(12);
  });

  it("topea en 500 aunque pidan mas", () => {
    expect(parseLimit("10000", 100)).toBe(500);
  });

  it("acepta un valor valido dentro de rango", () => {
    expect(parseLimit("25", 100)).toBe(25);
  });
});
