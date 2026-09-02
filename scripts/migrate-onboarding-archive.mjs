/**
 * Adds soft-archive columns to `customer_onboarding_applications`.
 *
 * ⚠ Why archive and not DELETE.
 *
 * Every `/api/admin/*` route in this app is gated CLIENT-side only (a
 * sessionStorage flag); there is no server session token to check, because
 * `api/admin/verify` deactivates the OTP and issues nothing. A hard-DELETE
 * endpoint on that surface would let anyone who knows the URL destroy customer
 * onboarding records — including signed ACH authorizations — with one request.
 * Archiving keeps the admin UI's "remove this test row" behaviour identical
 * while making the worst case a fully reversible hide.
 *
 * Genuine destruction stays where it belongs: an operator running
 * scripts/delete-onboarding-application.mjs with --commit.
 *
 * Idempotent — safe to re-run.
 *
 *   node scripts/migrate-onboarding-archive.mjs
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

  // TEXT, not a bounded VARCHAR: `archive_reason` is free-form operator input
  // and a narrow target column fed by an unbounded source is how you get a
  // SQLSTATE 22001 the first day somebody types a long sentence.
  await pool.query(`
    ALTER TABLE customer_onboarding_applications
      ADD COLUMN IF NOT EXISTS archived_at    TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS archived_by    TEXT,
      ADD COLUMN IF NOT EXISTS archive_reason TEXT
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_onboarding_archived_at
      ON customer_onboarding_applications (archived_at)
  `)

  const check = await pool.query(
    `SELECT column_name, data_type
       FROM information_schema.columns
      WHERE table_name = 'customer_onboarding_applications'
        AND column_name IN ('archived_at', 'archived_by', 'archive_reason')
      ORDER BY column_name`
  )
  console.table(check.rows)

  const counts = await pool.query(
    `SELECT count(*) FILTER (WHERE archived_at IS NULL)     AS active,
            count(*) FILTER (WHERE archived_at IS NOT NULL) AS archived
       FROM customer_onboarding_applications`
  )
  console.table(counts.rows)
  console.log('Onboarding archive columns ready.')

  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
