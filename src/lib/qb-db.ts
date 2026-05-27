import pg from 'pg'

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
 */
function connectionStringFor(dbName: string): string {
  const base = process.env.DATABASE_URL ?? ''
  try {
    const u = new URL(base)
    u.pathname = `/${dbName}`
    return u.toString()
  } catch {
    return base
  }
}

/**
 * Read-only pool for the UNLK Financial Portal database (`unlk_financial_portal`
 * on the same Aiven host as DATABASE_URL). Used to query QuickBooks-synced data
 * (customers, invoices, payments).
 */
export function getQBPool(): pg.Pool {
  if (!qbPool) {
    qbPool = new Pool({
      connectionString: connectionStringFor('unlk_financial_portal'),
      ssl: { rejectUnauthorized: false },
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
