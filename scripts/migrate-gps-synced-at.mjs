/**
 * Adds fleet_units.gps_synced_at — the timestamp of the last SUCCESSFUL
 * SkyBitz write for that unit.
 *
 * Why a new column instead of reusing updated_at: updated_at is bumped by any
 * admin edit to the row, so it cannot distinguish "GPS is fresh" from
 * "somebody changed the rental status yesterday". The GPS map read
 * `lastGpsTime ?? updatedAt` and therefore rendered four-month-old
 * coordinates as a healthy green "1 day ago" for any recently-edited unit.
 *
 * Additive and idempotent: one nullable column, no backfill, no data risk.
 *
 * Run: node --env-file=.env.local scripts/migrate-gps-synced-at.mjs
 */

import pg from 'pg'

const { Pool } = pg

// sslmode in the URL overrides the ssl object and escalates to verify-full,
// which Aiven's self-signed chain cannot satisfy. Strip it in any position.
function stripSslMode(url) {
  return url
    .replace(/([?&])sslmode=[^&]*/gi, '$1')
    .replace(/[?&]$/, '')
    .replace(/\?&/, '?')
    .replace(/&&/g, '&')
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Run with --env-file=.env.local')
    process.exitCode = 1
    return
  }

  const pool = new Pool({
    connectionString: stripSslMode(process.env.DATABASE_URL),
    ssl: { rejectUnauthorized: false },
  })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    console.log('1. Adding fleet_units.gps_synced_at')
    await client.query(`
      ALTER TABLE fleet_units
      ADD COLUMN IF NOT EXISTS gps_synced_at TIMESTAMPTZ
    `)

    console.log('2. Indexing for the "GPS data as of" lookup')
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_fleet_units_gps_synced_at
        ON fleet_units (gps_synced_at DESC NULLS LAST)
    `)

    await client.query('COMMIT')
    console.log('Migration complete.')

    const summary = await client.query(`
      SELECT COUNT(*) AS total,
             COUNT(gps_synced_at) AS ever_synced,
             COUNT(last_gps_time) AS with_fix,
             MAX(gps_synced_at) AS last_sync
      FROM fleet_units
    `)
    console.log('Summary:', summary.rows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Migration failed, rolled back:', err)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

main()
