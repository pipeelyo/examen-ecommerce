import { Pool } from "pg";

export interface RawAuditRow {
  id: number;
  entity_name: string;
  operation: "INSERT" | "UPDATE" | "DELETE";
  row_pk: string;
  actor: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  occurred_at: Date;
}

let pool: Pool | undefined;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.AUDIT_DATABASE_URL });
  }
  return pool;
}

/**
 * audit._x27f_evt_trace vive fuera de los schemas por-servicio (SDD §06):
 * la escriben solo los triggers de Postgres, ningun servicio de aplicacion
 * la posee. api-gateway es el unico lector, con su propia conexion — no
 * pasa por Prisma para evitar sumar un schema mas a la generacion
 * compartida de @prisma/client entre servicios (ver sdd/services/
 * 08-real-database-and-auth.md).
 */
export async function queryAuditEvents(entity: string | undefined, limit: number): Promise<RawAuditRow[]> {
  const client = getPool();
  const params: unknown[] = entity ? [entity, limit] : [limit];
  const where = entity ? "WHERE entity_name = $1" : "";
  const limitParam = entity ? "$2" : "$1";
  const result = await client.query<RawAuditRow>(
    `SELECT id, entity_name, operation, row_pk, actor, old_data, new_data, occurred_at
     FROM audit._x27f_evt_trace
     ${where}
     ORDER BY occurred_at DESC
     LIMIT ${limitParam}`,
    params,
  );
  return result.rows;
}
