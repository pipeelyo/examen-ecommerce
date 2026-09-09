import type { RawAuditRow } from "./audit-events.repository";

export interface AuditEventDto {
  id: number;
  entity_name: string;
  operation: "INSERT" | "UPDATE" | "DELETE";
  row_pk: string;
  actor: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  occurred_at: string;
}

export function toAuditEventDto(row: RawAuditRow): AuditEventDto {
  return {
    // pg devuelve BIGSERIAL como string (evita perder precision en bigints
    // grandes) — este id nunca se acerca a ese rango, así que castear a
    // number es seguro y mantiene el mismo shape que el AuditEvent mock.
    id: Number(row.id),
    entity_name: row.entity_name,
    operation: row.operation,
    row_pk: row.row_pk,
    actor: row.actor,
    old_data: row.old_data,
    new_data: row.new_data,
    occurred_at: row.occurred_at instanceof Date ? row.occurred_at.toISOString() : row.occurred_at,
  };
}

export function parseLimit(raw: string | undefined, fallback: number): number {
  const parsed = raw ? Number(raw) : NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.trunc(parsed), 500);
}
