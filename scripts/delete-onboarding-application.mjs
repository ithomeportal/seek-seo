/**
 * Permanently delete an onboarding application and its orphaned portal login
 * codes. Written for the "Test" company (msalazarm.unilik@gmail.com) but takes
 * the target as an argument so it is not a single-use script.
 *
 *   node scripts/delete-onboarding-application.mjs <email|id>            # dry run
 *   node scripts/delete-onboarding-application.mjs <email|id> --commit   # execute
 *
 * Dry run is the DEFAULT and prints exactly what would go. Every commit writes
 * a timestamped JSON backup of the rows before deleting, and the whole delete
 * runs inside one transaction — so a partial delete cannot leave login codes
 * behind for an application that no longer exists.
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
  const target = process.argv[2]
  const commit = process.argv.includes('--commit')

  if (!target) {
    console.error('Usage: node scripts/delete-onboarding-application.mjs <email|id> [--commit]')
    process.exit(1)
  }

  const raw = (process.env.DATABASE_URL ?? '').trim()
  if (raw === '') throw new Error('DATABASE_URL is not set')

  const pool = new pg.Pool({
    connectionString: stripSslMode(raw),
    ssl: { rejectUnauthorized: false },
    max: 2,
  })

  const byId = /^\d+$/.test(target)
  const apps = await pool.query(
    byId
      ? 'SELECT * FROM customer_onboarding_applications WHERE id = $1'
      : 'SELECT * FROM customer_onboarding_applications WHERE lower(email) = lower($1)',
    [target]
  )

  if (apps.rowCount === 0) {
    console.log(`No onboarding application matches "${target}". Nothing to do.`)
    await pool.end()
    return
  }

  console.log(`Matched ${apps.rowCount} onboarding application(s):`)
  console.table(
    apps.rows.map((r) => ({
      id: r.id,
      email: r.email,
      company: r.company_name,
      status: r.status,
      reference: r.reference,
      customer_id: r.customer_id,
      created: r.created_at,
    }))
  )

  const emails = [...new Set(apps.rows.map((r) => r.email))]

  // Related rows keyed by the applicant's email rather than by a foreign key.
  const codes = await pool.query(
    'SELECT * FROM customer_access_codes WHERE lower(email) = ANY($1::text[])',
    [emails.map((e) => e.toLowerCase())]
  )
  const sessions = await pool.query(
    'SELECT * FROM portal_sessions WHERE lower(email) = ANY($1::text[])',
    [emails.map((e) => e.toLowerCase())]
  )
  console.log(
    `Related: ${codes.rowCount} portal login code(s), ${sessions.rowCount} portal session(s).`
  )

  // A linked customer record is NOT deleted here — that is real business data
  // and removing it silently would be far worse than leaving it behind.
  const linked = apps.rows.filter((r) => r.customer_id !== null)
  if (linked.length > 0) {
    console.warn(
      `\n⚠ ${linked.length} application(s) are linked to a customer record ` +
        `(customer_id ${linked.map((r) => r.customer_id).join(', ')}). ` +
        `The customer row is left untouched — remove it by hand if it is also test data.`
    )
  }

  if (!commit) {
    console.log('\nDRY RUN — nothing was deleted. Re-run with --commit to execute.')
    await pool.end()
    return
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = path.join(process.cwd(), `onboarding-delete-backup-${stamp}.json`)
  fs.writeFileSync(
    backupFile,
    JSON.stringify(
      { deletedAt: new Date().toISOString(), target, applications: apps.rows, accessCodes: codes.rows, sessions: sessions.rows },
      null,
      2
    ),
    'utf8'
  )
  console.log(`\nBackup written to ${backupFile}`)

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const ids = apps.rows.map((r) => r.id)
    const lowered = emails.map((e) => e.toLowerCase())

    const delSessions = await client.query(
      'DELETE FROM portal_sessions WHERE lower(email) = ANY($1::text[])',
      [lowered]
    )
    const delCodes = await client.query(
      'DELETE FROM customer_access_codes WHERE lower(email) = ANY($1::text[])',
      [lowered]
    )
    const delApps = await client.query(
      'DELETE FROM customer_onboarding_applications WHERE id = ANY($1::int[])',
      [ids]
    )

    await client.query('COMMIT')
    console.log(
      `Deleted: ${delApps.rowCount} application(s), ${delCodes.rowCount} login code(s), ` +
        `${delSessions.rowCount} session(s).`
    )
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
