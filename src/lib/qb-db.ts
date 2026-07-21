import pg from 'pg'
import { AIVEN_SSL, stripSslMode } from './pg-connection'

const { Pool } = pg

let qbPool: pg.Pool | null = null

/**
 * Build a connection string for another database on the same Aiven host as
 * DATABASE_URL by swapping ONLY the pathname (database name), preserving host,
 * credentials, port, and query params.
 *
 * Do NOT string-replace `/seek_equipment`: the prod DATABASE_URL's database name
 * is not necessarily literally "seek_equipment" (it differs from local
 * .env.local), so the replace would silently no-op and leave the pool on the
 * wrong DB. Setting `url.pathname` works regardless of the original name.
 * (See the matching fix + writeup in src/lib/fmcsa-db.ts, commit c7a4d91.)
 *
 * `envVar` is REQUIRED, deliberately. It used to be optional, which meant a
 * caller could omit it and silently fall back to deriving the URL — reopening
 * the exact bug this guard exists to prevent, with no error. Making it
 * mandatory moves that guarantee from convention into the type signature.
 */
function connectionStringFor(dbName: string, envVar: string): string {
  // Prefer an explicit, per-database URL with its own least-privilege role.
  // Deriving from DATABASE_URL only works while the two databases share a
  // credential — the Jul 2026 role migration broke that, and every qb_* query
  // began failing with SQLSTATE 42501 "permission denied for table".
  const explicit = process.env[envVar]
  const base = explicit || process.env.DATABASE_URL || ''
  let url = base
  if (!explicit) {
    try {
      const u = new URL(base)
      u.pathname = `/${dbName}`
      url = u.toString()
    } catch {
      url = base
    }
  }
  // sslmode in the URL overrides the `ssl` object we pass to Pool and fails
  // against Aiven's chain (SELF_SIGNED_CERT_IN_CHAIN). Shared with every other
  // pool via pg-connection so the rule cannot be missed in one place again.
  return stripSslMode(url)
}

/**
 * Read-only pool for the UNLK Financial Portal database (`unlk_financial_portal`
 * on the same Aiven host as DATABASE_URL). Used to query QuickBooks-synced data
 * (customers, invoices, payments).
 */
export function getQBPool(): pg.Pool {
  if (!qbPool) {
    qbPool = new Pool({
      connectionString: connectionStringFor('unlk_financial_portal', 'QB_DATABASE_URL'),
      ssl: AIVEN_SSL,
      max: 3,
      idleTimeoutMillis: 30000,
    })
  }
  return qbPool
}

export async function qbQuery<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: (string | number | boolean | null)[]
): Promise<pg.QueryResult<T>> {
  const p = getQBPool()
  return p.query<T>(text, params)
}
