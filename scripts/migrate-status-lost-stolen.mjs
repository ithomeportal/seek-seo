/**
 * Add the fleet statuses `lost` and `stolen` to the fleet_units CHECK constraint.
 *
 *   node scripts/migrate-status-lost-stolen.mjs
 *
 * 2026-09-15 (Bruno feedback, ?tab=fleet request 1): two new statuses, "Lost"
 * and "Stolen".
 *
 * `fleet_units.status` is guarded by `fleet_units_status_check`, so the
 * allowed-values list has to be widened BEFORE the UI offers the options — a
 * save with an unlisted status fails with SQLSTATE 23514 and the admin editor
 * surfaces it as a generic failure.
 *
 * Widening a CHECK is backwards-compatible: every existing row still satisfies
 * it, so this is safe to run ahead of the deploy (and must be — the reverse
 * order gives a window where the dropdown offers a value the table rejects).
 *
 * Idempotent — the constraint is dropped and recreated from the full list.
 *
 * ⚠ `stripSslMode` is not optional. Production's DATABASE_URL carries
 * `?sslmode=require`, which node-postgres treats as `verify-full` and which
 * overrides the `ssl` object below — every query then dies with
 * SELF_SIGNED_CERT_IN_CHAIN against Aiven's self-signed chain. `.env.local`
 * carries no sslmode, so a script without this runs clean locally and fails
 * only when pointed at prod. See docs/SPEC-LESSONS-LEARNED.md (2026-07-21).
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

/** The complete allowed list after this migration, not just the additions. */
const STATUSES = [
  'available',
  'rented',
  'damaged',
  'for_sale',
  'maintenance',
  'sold',
  'make_ready',
  'return_inspection',
  'lease_to_own',
  'lost',
  'stolen',
]

const CONSTRAINT_SQL = `
  ALTER TABLE fleet_units
  ADD CONSTRAINT fleet_units_status_check CHECK (
    status::text = ANY (ARRAY[
      ${STATUSES.map((s) => `'${s}'::varchar`).join(',\n      ')}
    ]::text[])
  )
`

async function readConstraint(client) {
  const { rows } = await client.query(
    `SELECT pg_get_constraintdef(oid) AS def
       FROM pg_constraint
      WHERE conrelid = 'fleet_units'::regclass
        AND conname  = 'fleet_units_status_check'`
  )
  return rows[0]?.def ?? null
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

  const client = await pool.connect()
  try {
    console.log('BEFORE:', await readConstraint(client))

    await client.query('BEGIN')
    await client.query(
      `ALTER TABLE fleet_units DROP CONSTRAINT IF EXISTS fleet_units_status_check`
    )
    await client.query(CONSTRAINT_SQL)
    await client.query('COMMIT')

    // Post-check: prove the change actually landed rather than trusting COMMIT.
    // A migration that reports success without verifying is how a dead
    // constraint sits unnoticed until the first save fails in front of a user.
    const after = await readConstraint(client)
    console.log('AFTER: ', after)
    for (const s of ['lost', 'stolen']) {
      if (after === null || !after.includes(`'${s}'`)) {
        throw new Error(`Constraint does not list '${s}' after migration`)
      }
    }
    console.log(`Migration complete — ${STATUSES.length} statuses allowed.`)
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error('Migration failed, rolled back:', err)
  process.exit(1)
})
