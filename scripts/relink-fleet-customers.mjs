/**
 * Repoint `fleet_units.customer_id` at the customer the unit is actually
 * rented to.
 *
 *   node scripts/relink-fleet-customers.mjs            # dry run (default)
 *   node scripts/relink-fleet-customers.mjs --commit   # execute
 *
 * ⚠ Why this is needed. `customer_id` is written by exactly one thing —
 * scripts/seed-from-excel.mjs, in April 2026 — and by nothing since: the admin
 * Fleet editor updates `rented_to` (free text) and has no mapping for
 * `customer_id` at all (see src/app/api/admin/fleet/[id]/route.ts). So the
 * column froze at whatever the seed's fuzzy matcher produced, while `rented_to`
 * kept moving. By September 2026 it was crediting Hammerhead with SilverKing's
 * three units, Kay's one, Rockin LH's one and one of Voldhaul's; Blue Line
 * Express with Apollo's two and WYO's one; Griffin with GNS's; and E&L
 * Transport with Family Transit's.
 *
 * Nothing surfaced it because a wrong link is not an error — the Customers tab
 * renders a rental journal for whoever the column names, and it looks exactly
 * as convincing as a right one. It only became visible once every onboarding
 * company got a customer row and six of them showed zero units while somebody
 * else showed their rent.
 *
 * The match is `rented_to` → `customers.company_name`/`alias` on the same
 * normalised key the rest of the app uses. Anything ambiguous or unmatched is
 * REPORTED AND LEFT ALONE — a wrong link is what this script exists to undo,
 * so it must never invent one. Dry run is the default; a commit writes a JSON
 * backup of every affected row first and runs in one transaction.
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

/** Kept byte-identical to companyNameKey() in src/lib/onboarding.ts. */
function nameKey(value) {
  return (value ?? '')
    .toLowerCase()
    .replace(/[.,]/g, '')
    .replace(/\b(llc|inc|l\.l\.c|corp|corporation|co|ltd)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function main() {
  loadEnv()
  const commit = process.argv.includes('--commit')

  const raw = (process.env.DATABASE_URL ?? '').trim()
  if (raw === '') throw new Error('DATABASE_URL is not set')

  const pool = new pg.Pool({
    connectionString: stripSslMode(raw),
    ssl: { rejectUnauthorized: false },
    max: 2,
  })

  const customers = await pool.query(
    'SELECT id, company_name, alias FROM customers ORDER BY id ASC'
  )
  const units = await pool.query(
    `SELECT id, unit_number, rented_to, customer_id, status
       FROM fleet_units
      WHERE rented_to IS NOT NULL AND TRIM(rented_to) <> ''
      ORDER BY rented_to, unit_number`
  )

  // A key that resolves to more than one customer is ambiguous by definition
  // and gets no automatic answer.
  const byKey = new Map()
  for (const c of customers.rows) {
    for (const source of [c.company_name, c.alias]) {
      const k = nameKey(source)
      if (k === '') continue
      if (!byKey.has(k)) byKey.set(k, new Set())
      byKey.get(k).add(c.id)
    }
  }
  const nameById = new Map(customers.rows.map((c) => [c.id, c.company_name]))

  const changes = []
  const unmatched = new Map()
  const ambiguous = new Map()

  for (const u of units.rows) {
    const key = nameKey(u.rented_to)
    const ids = key === '' ? null : byKey.get(key)

    if (!ids || ids.size === 0) {
      if (!unmatched.has(u.rented_to)) unmatched.set(u.rented_to, [])
      unmatched.get(u.rented_to).push(u)
      continue
    }
    if (ids.size > 1) {
      if (!ambiguous.has(u.rented_to)) ambiguous.set(u.rented_to, [...ids])
      continue
    }

    const target = [...ids][0]
    if (u.customer_id === target) continue
    changes.push({
      unit: u.unit_number,
      rentedTo: u.rented_to,
      from: u.customer_id === null ? '(none)' : `${u.customer_id} ${nameById.get(u.customer_id) ?? '?'}`,
      to: `${target} ${nameById.get(target)}`,
      id: u.id,
      targetId: target,
    })
  }

  console.log(
    `${units.rowCount} rented unit(s) with a "rented to" name, ${customers.rowCount} customer(s).`
  )

  if (changes.length > 0) {
    console.log(`\n${changes.length} unit(s) would be repointed:`)
    console.table(changes.map(({ unit, rentedTo, from, to }) => ({ unit, rentedTo, from, to })))
  } else {
    console.log('\nEvery matched unit already points at the right customer.')
  }

  if (unmatched.size > 0) {
    console.warn(`\n⚠ No customer matches these "rented to" names — LEFT UNTOUCHED:`)
    for (const [name, list] of unmatched) {
      console.warn(
        `   ${name} — ${list.length} unit(s): ${list.map((u) => u.unit_number).join(', ')}` +
          `${list.some((u) => u.customer_id !== null) ? ' (currently linked to someone!)' : ''}`
      )
    }
    console.warn('   Create the customer, or correct the name in Fleet Master, then re-run.')
  }

  if (ambiguous.size > 0) {
    console.warn(`\n⚠ These names match more than one customer — LEFT UNTOUCHED:`)
    for (const [name, ids] of ambiguous) {
      console.warn(`   ${name} → customers ${ids.join(', ')}`)
    }
  }

  if (changes.length === 0) {
    await pool.end()
    return
  }

  if (!commit) {
    console.log('\nDRY RUN — nothing was written. Re-run with --commit to execute.')
    await pool.end()
    return
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = path.join(process.cwd(), `fleet-customer-relink-backup-${stamp}.json`)
  fs.writeFileSync(
    backupFile,
    JSON.stringify(
      { relinkedAt: new Date().toISOString(), unitsBefore: units.rows, changes },
      null,
      2
    ),
    'utf8'
  )
  console.log(`\nBackup written to ${backupFile}`)

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const c of changes) {
      await client.query(
        'UPDATE fleet_units SET customer_id = $1, updated_at = NOW() WHERE id = $2',
        [c.targetId, c.id]
      )
    }
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  console.log(`\nRepointed ${changes.length} unit(s). The backup above restores the old values.`)
  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
