import pg from 'pg'

const { Pool } = pg

let qbPool: pg.Pool | null = null

/**
 * Read-only pool for the UNLK Financial Portal database.
 * Used to query QuickBooks-synced data (customers, invoices, payments).
 */
export function getQBPool(): pg.Pool {
  if (!qbPool) {
    const baseUrl = process.env.DATABASE_URL ?? ''
    // Same Aiven host, different database
    const qbUrl = baseUrl.replace(/\/seek_equipment/, '/unlk_financial_portal')

    qbPool = new Pool({
      connectionString: qbUrl,
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
