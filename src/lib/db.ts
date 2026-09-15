import pg from 'pg'
import { poolConfigFor } from './pg-connection'

const { Pool } = pg

let pool: pg.Pool | null = null

/**
 * Primary pool for this app's own database (`seek_equipment`), role `seek_app`.
 *
 * The connection string goes through `poolConfigFor` so `sslmode` is stripped.
 * Passing DATABASE_URL to `new Pool()` unmodified is what broke production on
 * 2026-07-21: the prod URL carries `?sslmode=require`, node-postgres escalated
 * it to `verify-full`, and every query on this pool threw
 * SELF_SIGNED_CERT_IN_CHAIN. Local `.env.local` has no sslmode, so it passed
 * every local check. Do NOT inline `process.env.DATABASE_URL` here again.
 */
/** A value node-postgres can bind, including an array for `= ANY($1)`. */
type QueryScalar = string | number | boolean | null
export type QueryParam = QueryScalar | QueryScalar[]

export function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool(poolConfigFor('DATABASE_URL', { max: 5 }))
  }
  return pool
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  // Arrays are included because node-postgres binds a JS array to a Postgres
  // array — `WHERE status = ANY($1::text[])` keeps a value list parameterised
  // instead of interpolated into the SQL string.
  params?: QueryParam[]
): Promise<pg.QueryResult<T>> {
  const p = getPool()
  return p.query<T>(text, params)
}
