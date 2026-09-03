/**
 * Add the quote-specific columns to `contact_submissions`.
 *
 *   node scripts/migrate-contact-submissions-quote-fields.mjs
 *
 * ⚠ Why this was needed: THE QUOTE FORM HAD NEVER WORKED.
 *
 * `/api/quote` has always inserted into `trailer_type, quantity, duration,
 * start_date` — columns that were never created. Every submission therefore
 * threw `42703 column "trailer_type" of relation "contact_submissions" does not
 * exist`, the route's `catch` swallowed it without logging anything at all, and
 * the customer was told "Something went wrong. Please try again." The request
 * was lost completely — not saved, not emailed, not counted.
 *
 * It stayed invisible because every other half of the feature was already
 * built and looked correct: `/api/admin/inquiries` maps all four columns, the
 * dashboard's `Inquiry` type declares all four, and the form validates all four.
 * Only the table was missing, and nothing ever said so out loud. The one row in
 * the table after five months is `type='contact'` — the tell nobody read.
 *
 * Idempotent — safe to re-run.
 *
 * ⚠ TEXT, not a narrower type, on purpose:
 *  - `trailer_type` / `duration` are enum slugs today, but a bounded varchar
 *    fed by a form is the SQLSTATE 22001 shape this codebase keeps hitting.
 *  - `start_date` is `z.string().optional()` in `quoteSchema` with NO format
 *    validation, so a DATE column would raise 22007 on the first odd input —
 *    reintroducing exactly the silent-loss bug this migration exists to fix.
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

const COLUMNS = [
  ['trailer_type', 'TEXT'],
  ['quantity', 'INTEGER'],
  ['duration', 'TEXT'],
  ['start_date', 'TEXT'],
  // `/api/admin/inquiries` already maps `updated_at`; it was missing too, so the
  // admin list has been reading undefined for it since the table was created.
  ['updated_at', 'TIMESTAMPTZ'],
]

async function main() {
  loadEnv()
  const raw = (process.env.DATABASE_URL ?? '').trim()
  if (raw === '') throw new Error('DATABASE_URL is not set')

  const pool = new pg.Pool({
    connectionString: stripSslMode(raw),
    ssl: { rejectUnauthorized: false },
    max: 2,
  })

  const before = await pool.query(
    `SELECT column_name FROM information_schema.columns
      WHERE table_name = 'contact_submissions' ORDER BY ordinal_position`
  )
  console.log('before:', before.rows.map((r) => r.column_name).join(', '))

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const [name, type] of COLUMNS) {
      await client.query(
        `ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS ${name} ${type}`
      )
    }
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  const after = await pool.query(
    `SELECT column_name, data_type FROM information_schema.columns
      WHERE table_name = 'contact_submissions' ORDER BY ordinal_position`
  )
  console.log('after :', after.rows.map((r) => r.column_name).join(', '))

  const missing = COLUMNS.map(([n]) => n).filter(
    (n) => !after.rows.some((r) => r.column_name === n)
  )
  if (missing.length > 0) throw new Error(`still missing: ${missing.join(', ')}`)
  console.log('\n✓ all quote columns present')

  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
