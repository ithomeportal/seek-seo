import pg from 'pg'

const { Pool } = pg

let censusPool: pg.Pool | null = null
let geoPool: pg.Pool | null = null

/**
 * Build a connection string for another database on the same Aiven host as
 * DATABASE_URL by swapping ONLY the pathname (database name), preserving host,
 * credentials, port, and query params (e.g. ?sslmode=require).
 *
 * This must NOT string-replace the source database name: the prod DATABASE_URL's
 * database is not necessarily literally "seek_equipment" (it differs from local
 * .env.local), which silently left the pool on the wrong DB → "relation does not
 * exist". Setting `url.pathname` works regardless of the original name.
 *
 * `envVar` is REQUIRED, deliberately. It used to be optional, which meant a
 * caller could omit it and silently fall back to deriving the URL — reopening
 * the exact bug this guard exists to prevent, with no error. Making it
 * mandatory moves that guarantee from convention into the type signature.
 */
function connectionStringFor(dbName: string, envVar: string): string {
  // Prefer an explicit, per-database URL with its own least-privilege role.
  // Deriving another database's URL from DATABASE_URL only works while the two
  // share a credential — the Jul 2026 role migration gave each database its own
  // role, so every derived pool started failing with SQLSTATE 42501
  // "permission denied for table". Keep the swap only as a local-dev fallback.
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
  return stripSslMode(url)
}

/**
 * Strip any sslmode param. node-postgres lets sslmode in the URL override the
 * `ssl` object we pass to Pool, forcing strict verification that fails against
 * Aiven's chain (SELF_SIGNED_CERT_IN_CHAIN).
 */
function stripSslMode(url: string): string {
  return url
    .replace(/([?&])sslmode=[^&]*/gi, '$1')
    .replace(/[?&]$/, '')
    .replace(/\?&/, '?')
    .replace(/&&/g, '&')
}

/**
 * Read-only pool for the FMCSA census carrier registry, in the
 * `unilink_portal_ap` database on the same Aiven host as DATABASE_URL. Synced
 * weekly from data.transportation.gov by AP_module's cron — seek-seo is a pure
 * read consumer, never write to it.
 */
export function getFmcsaPool(): pg.Pool {
  if (!censusPool) {
    censusPool = new Pool({
      connectionString: connectionStringFor('unilink_portal_ap', 'CENSUS_DATABASE_URL'),
      ssl: { rejectUnauthorized: false },
      max: 2,
      idleTimeoutMillis: 30000,
    })
  }
  return censusPool
}

/**
 * Read-only pool for the US/CAN/MEX postal-code geocode table (`postal_codes` in
 * `geo_zip_usa_can_mex` on the same host), used to resolve a ZIP to a lat/lon
 * centre for radius search.
 */
export function getGeoZipPool(): pg.Pool {
  if (!geoPool) {
    geoPool = new Pool({
      connectionString: connectionStringFor('geo_zip_usa_can_mex', 'GEO_DATABASE_URL'),
      ssl: { rejectUnauthorized: false },
      max: 1,
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
