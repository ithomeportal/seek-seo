/**
 * Creates `system_alert_log` — the throttle ledger for immediate (non-daily)
 * operational alerts, currently the "SkyBitz feed is down" escalation raised
 * from /api/cron/gps-sync.
 *
 * Columns are TEXT rather than a bounded VARCHAR on purpose: a narrow target
 * column fed by an unbounded source is the classic SQLSTATE 22001 grenade, and
 * `detail` carries arbitrary provider error text.
 *
 * Idempotent — safe to re-run.
 *
 *   node scripts/migrate-gps-watchdog-alerts.mjs
 */
import pg from 'pg'
import fs from 'node:fs'
import path from 'node:path'

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const p = path.join(process.cwd(), file)
    if (!fs.existsSync(p)) continue
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const trimmed = line.trim()
      if (trimmed === '' || trimmed.startsWith('#') || !trimmed.includes('=')) continue
      const i = trimmed.indexOf('=')
      const key = trimmed.slice(0, i).trim()
      const value = trimmed.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')
      if (!(key in process.env)) process.env[key] = value
    }
  }
}

/** Mirrors src/lib/pg-connection.ts — sslmode in the URL overrides `ssl`. */
function stripSslMode(url) {
  return url
    .replace(/([?&])sslmode=[^&]*/gi, '$1')
    .replace(/[?&]$/, '')
    .replace(/\?&/, '?')
    .replace(/&&/g, '&')
}

async function main() {
  loadEnv()
  const raw = (process.env.DATABASE_URL ?? '').trim()
  if (raw === '') throw new Error('DATABASE_URL is not set')

  const pool = new pg.Pool({
    connectionString: stripSslMode(raw),
    ssl: { rejectUnauthorized: false },
    max: 2,
  })

  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_alert_log (
      alert_key    TEXT PRIMARY KEY,
      last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      detail       TEXT
    )
  `)

  const check = await pool.query(
    `SELECT column_name, data_type
       FROM information_schema.columns
      WHERE table_name = 'system_alert_log'
      ORDER BY ordinal_position`
  )
  console.table(check.rows)
  console.log('system_alert_log ready.')

  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
