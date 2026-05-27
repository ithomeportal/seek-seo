import pg from 'pg'

const { Pool } = pg

let censusPool: pg.Pool | null = null
let geoPool: pg.Pool | null = null

/**
 * Read-only pool for the FMCSA census carrier registry.
 *
 * The data lives in the `unilink_portal_ap` database on the same Aiven host as
 * `seek_equipment` (same credentials, different database name — identical to the
 * cross-DB pattern in qb-db.ts). The table is synced weekly from
 * data.transportation.gov by AP_module's cron, so seek-seo is a pure read
 * consumer here — never write to it.
 */
export function getFmcsaPool(): pg.Pool {
  if (!censusPool) {
    const baseUrl = process.env.DATABASE_URL ?? ''
    const url = baseUrl.replace(/\/seek_equipment(\?|$)/, '/unilink_portal_ap$1')
    censusPool = new Pool({
      connectionString: url,
      ssl: { rejectUnauthorized: false },
      max: 3,
      idleTimeoutMillis: 30000,
    })
  }
  return censusPool
}

/**
 * Read-only pool for the US/CAN/MEX postal-code geocode table, used to resolve a
 * ZIP to a lat/lon centre for radius search. Lives in `geo_zip_usa_can_mex` on
 * the same host.
 */
export function getGeoZipPool(): pg.Pool {
  if (!geoPool) {
    const baseUrl = process.env.DATABASE_URL ?? ''
    const url = baseUrl.replace(/\/seek_equipment(\?|$)/, '/geo_zip_usa_can_mex$1')
    geoPool = new Pool({
      connectionString: url,
      ssl: { rejectUnauthorized: false },
      max: 2,
      idleTimeoutMillis: 30000,
    })
  }
  return geoPool
}

export async function fmcsaQuery<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  return getFmcsaPool().query<T>(text, params as never)
}
