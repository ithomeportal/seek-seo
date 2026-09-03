/**
 * Give every company in the Onboarding tab a real row in `customers`.
 *
 *   node scripts/link-onboarding-customers.mjs            # dry run (default)
 *   node scripts/link-onboarding-customers.mjs --commit   # execute
 *
 * `customers` and `customer_onboarding_applications` were built entirely
 * disjoint: nothing linked them and `customer_id` was NULL on every onboarding
 * row, so a company that signed up through the portal only ever existed as an
 * onboarding record. Request of 2026-09-03: *"Add all customers currently
 * listed in the Onboarding section to the Customers section."*
 *
 * For each non-archived application this either LINKS it to the customer that
 * already represents that company (matched on email, then on a normalised
 * company name — the same rules `/api/admin/customers` uses) or CREATES one,
 * enriched from the company's credit application where there is one. Either
 * way the application ends up carrying `customer_id`, which is what turns the
 * loose heuristic match in the admin UI into an exact link.
 *
 * Dry run is the DEFAULT and prints every planned insert and link. A commit
 * writes a timestamped JSON backup first, runs inside ONE transaction, and
 * prints the ids it created so the write is trivially reversible.
 *
 * ⚠ Column widths are clamped, never assumed. The onboarding contact-name
 * columns are varchar(120) while the customer ones are varchar(100): an
 * `INSERT … SELECT` across that pair raises SQLSTATE 22001 the first day a
 * long name arrives. Every value goes through fit() and anything trimmed is
 * reported loudly instead of failing the transaction.
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

/**
 * Loose key for matching a company to a customer. Kept byte-identical to
 * `nameKey` in src/app/api/admin/customers/route.ts — if the two ever drift,
 * the admin UI and this script disagree about who is already a customer.
 */
function nameKey(value) {
  return (value ?? '')
    .toLowerCase()
    .replace(/[.,'‘’]/g, '')
    .replace(/\b(llc|inc|l\.l\.c|corp|corporation|co|ltd)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const clipped = []

/** Clamp a value to its target column width, recording anything trimmed. */
function fit(value, max, label) {
  if (value === null || value === undefined) return null
  const s = String(value).trim()
  if (s === '') return null
  if (s.length <= max) return s
  clipped.push(`${label}: ${s.length} chars → clamped to ${max} ("${s.slice(0, max)}…")`)
  return s.slice(0, max)
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

  // Archived rows are excluded deliberately: archiving is how an admin removes
  // a test or mistaken submission, and it must not resurface as a customer.
  const apps = await pool.query(
    `SELECT * FROM customer_onboarding_applications
      WHERE archived_at IS NULL
      ORDER BY created_at ASC`
  )
  const customers = await pool.query('SELECT * FROM customers ORDER BY id ASC')
  const creditApps = await pool.query(
    'SELECT * FROM credit_applications ORDER BY id ASC'
  )

  console.log(
    `${apps.rowCount} live onboarding application(s), ${customers.rowCount} existing customer(s).`
  )

  const byEmail = new Map()
  const byName = new Map()
  for (const c of customers.rows) {
    if (c.email) byEmail.set(c.email.toLowerCase().trim(), c.id)
    const k = nameKey(c.company_name)
    if (k !== '') byName.set(k, c.id)
    const a = nameKey(c.alias)
    if (a !== '') byName.set(a, c.id)
  }

  // Credit applications carry the address, entity type, insurance and A/P
  // contact that onboarding never asks for. Email is the strong signal; the
  // normalised company name is the fallback (Family Transit's credit app is
  // filed under the owner's personal name, and matches only on email).
  const caByEmail = new Map()
  const caByName = new Map()
  for (const ca of creditApps.rows) {
    if (ca.signatory_email) caByEmail.set(ca.signatory_email.toLowerCase().trim(), ca)
    if (ca.ap_email) caByEmail.set(ca.ap_email.toLowerCase().trim(), ca)
    const k = nameKey(ca.customer_name)
    if (k !== '') caByName.set(k, ca)
  }

  const plan = []
  for (const app of apps.rows) {
    const email = (app.email ?? '').toLowerCase().trim()
    const company = app.company_name ?? app.email
    const key = nameKey(app.company_name)

    if (app.customer_id !== null) {
      plan.push({ app, action: 'skip', reason: `already linked to customer ${app.customer_id}` })
      continue
    }

    const existing = byEmail.get(email) ?? (key !== '' ? byName.get(key) : undefined) ?? null
    if (existing !== null) {
      plan.push({ app, action: 'link', customerId: existing, company })
      continue
    }

    const ca = caByEmail.get(email) ?? (key !== '' ? caByName.get(key) : undefined) ?? null
    plan.push({ app, action: 'create', company, ca })
  }

  const creates = plan.filter((p) => p.action === 'create')
  const links = plan.filter((p) => p.action === 'link')
  const skips = plan.filter((p) => p.action === 'skip')

  console.table(
    plan.map((p) => ({
      action: p.action,
      reference: p.app.reference,
      company: p.company ?? p.app.company_name,
      email: p.app.email,
      enrichedFrom: p.ca ? p.ca.reference_number : '',
      note: p.reason ?? '',
    }))
  )
  console.log(
    `\nPlan: ${creates.length} customer(s) to create, ${links.length} to link to an ` +
      `existing customer, ${skips.length} already linked.`
  )

  if (creates.length === 0 && links.length === 0) {
    console.log('Nothing to do.')
    await pool.end()
    return
  }

  /** Build the customer row for an application, clamped to the real widths. */
  function customerValues({ app, ca }) {
    return [
      fit(app.company_name ?? app.email, 255, `${app.reference} company_name`),
      fit(app.contact_first_name, 100, `${app.reference} contact_first_name`),
      fit(app.contact_last_name, 100, `${app.reference} contact_last_name`),
      fit(app.phone, 50, `${app.reference} phone`),
      fit(app.email, 255, `${app.reference} email`),
      fit(ca?.entity_type, 50, `${app.reference} business_type`),
      fit(ca?.state_entity_formed, 50, `${app.reference} state_formed`),
      ca?.customer_street ? String(ca.customer_street).trim() : null, // address is TEXT
      fit(ca?.customer_city, 100, `${app.reference} city`),
      fit(ca?.customer_state, 50, `${app.reference} state`),
      fit(ca?.customer_zip, 20, `${app.reference} zip`),
      fit(ca?.insurance_company, 255, `${app.reference} insurance_company`),
      fit(ca?.insurance_phone, 50, `${app.reference} insurance_phone`),
      app.ach_authorized_at !== null,
      fit(app.ach_bank_name, 255, `${app.reference} ach_bank_name`),
      fit(app.ach_account_last4, 4, `${app.reference} ach_account_last4`),
      fit(ca?.ap_email, 255, `${app.reference} ap_email`),
      fit(ca?.ap_phone, 50, `${app.reference} ap_phone`),
    ]
  }

  // Run the clamp over every planned row now, so a dry run reports overflow
  // just as loudly as a commit would.
  for (const p of creates) customerValues(p)
  if (clipped.length > 0) {
    console.warn('\n⚠ Values clamped to their column width:')
    for (const line of clipped) console.warn(`   ${line}`)
  }

  if (!commit) {
    console.log('\nDRY RUN — nothing was written. Re-run with --commit to execute.')
    await pool.end()
    return
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = path.join(process.cwd(), `onboarding-customer-link-backup-${stamp}.json`)
  fs.writeFileSync(
    backupFile,
    JSON.stringify(
      {
        linkedAt: new Date().toISOString(),
        applicationsBefore: apps.rows,
        customersBefore: customers.rows,
      },
      null,
      2
    ),
    'utf8'
  )
  console.log(`\nBackup written to ${backupFile}`)

  const client = await pool.connect()
  const created = []
  try {
    await client.query('BEGIN')

    for (const p of creates) {
      const res = await client.query(
        `INSERT INTO customers (
           company_name, contact_first_name, contact_last_name, phone, email,
           business_type, state_formed, address, city, state, zip,
           insurance_company, insurance_phone, ach_authorized, ach_bank_name,
           ach_account_last4, ap_email, ap_phone, status, created_at, updated_at
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
           'active', NOW(), NOW()
         ) RETURNING id`,
        customerValues(p)
      )
      const id = res.rows[0].id
      created.push({ id, company: p.company, reference: p.app.reference })
      await client.query(
        `UPDATE customer_onboarding_applications
            SET customer_id = $1, updated_at = NOW()
          WHERE id = $2`,
        [id, p.app.id]
      )
    }

    for (const p of links) {
      await client.query(
        `UPDATE customer_onboarding_applications
            SET customer_id = $1, updated_at = NOW()
          WHERE id = $2`,
        [p.customerId, p.app.id]
      )
    }

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  console.log(`\nCreated ${created.length} customer(s):`)
  console.table(created)
  console.log(`Linked ${links.length} application(s) to an existing customer.`)
  console.log(
    `\nTo undo: DELETE FROM customers WHERE id IN (${created.map((c) => c.id).join(', ') || '—'});` +
      `\n         UPDATE customer_onboarding_applications SET customer_id = NULL WHERE customer_id IS NOT NULL;`
  )

  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
