/**
 * Normalizes `db.execute()` results across Drizzle drivers.
 * - postgres-js returns a RowList (array-like)
 * - pglite returns `{ rows, fields, affectedRows }`
 */
export function toRows(result: unknown): unknown[] {
  if (Array.isArray(result)) return result;
  if (result && typeof result === "object" && "rows" in result) {
    const { rows } = result as { rows: unknown };
    if (Array.isArray(rows)) return rows;
  }
  throw new Error("Resultado de db.execute() con forma inesperada");
}
