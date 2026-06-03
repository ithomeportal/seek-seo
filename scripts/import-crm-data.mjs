import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'

const { Pool } = pg

// Imports the MANUS trailer_crm CSV export (trailer_crm_csv_export.zip) into the
// crm_* tables. Usage:
//   DATABASE_URL=... node scripts/import-crm-data.mjs --dir /path/to/csv/folder [--force]
//
// Expects: sales_reps.csv, leads.csv, deals.csv, activities.csv (fleet.csv and
// rentals.csv are ignored — fleet_units is the source of truth, no rentals table).
// - Full CSV parser (quoted fields may contain commas and NEWLINES — lead notes do).
// - MANUS trailer labels mapped to site canonical keys.
// - MANUS auto-increment IDs remapped to new SERIAL ids (deals.leadId, activities.relatedToId).
// - Original timestamps preserved.
// - Aborts if crm_leads already has rows, unless --force is passed (then it appends).

const MANUS_TYPE_MAP = {
  'Sand Chassis': 'sand_chassis',
  'Sand Hopper/BD': 'sand_hopper',
  'Belly Dump': 'belly_dump',
  Tanker: 'tank',
  'Dry Van': 'dry_van',
  'Flat Bed': 'flatbed',
}
const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost']
const DEAL_STAGES = ['Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']

function parseCsv(text) {
  // Full-text state machine: handles quoted fields containing commas, quotes, newlines.
  const rows = []
  let row = []
  let cur = ''
  let inQ = false
  let i = 0
  while (i < text.length) {
    const c = text[i]
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQ = false
        }
      } else {
        cur += c
      }
    } else if (c === '"') {
      inQ = true
    } else if (c === ',') {
      row.push(cur)
      cur = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cur)
      cur = ''
      if (row.length > 1 || row[0] !== '') rows.push(row)
      row = []
    } else {
      cur += c
    }
    i++
  }
  if (cur !== '' || row.length > 0) {
    row.push(cur)
    if (row.length > 1 || row[0] !== '') rows.push(row)
  }
  if (rows.length === 0) return []
  const header = rows[0].map((h) => h.trim())
  return rows.slice(1).map((cells) => {
    const obj = {}
    header.forEach((h, idx) => {
      obj[h] = cells[idx] ?? ''
    })
    return obj
  })
}

function readCsv(dir, name) {
  const file = path.join(dir, name)
  if (!fs.existsSync(file)) {
    console.log(`   (${name} not found — skipping)`)
    return []
  }
  return parseCsv(fs.readFileSync(file, 'utf8'))
}

const ts = (v) => (v && String(v).trim() ? new Date(v).toISOString() : null)
const num = (v, d = 0) => (v === '' || v === null || v === undefined ? d : Number(v))
const bool = (v) => v === '1' || v === 1 || v === true || v === 'true'
const str = (v) => (v && String(v).trim() ? String(v).trim() : null)

function mapTrailerInterest(raw) {
  if (!raw || !raw.trim()) return { mapped: [], unmapped: [] }
  let labels = []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) labels = parsed
  } catch {
    labels = raw.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
  }
  const mapped = []
  const unmapped = []
  for (const l of labels) {
    const key = MANUS_TYPE_MAP[l] ?? (Object.values(MANUS_TYPE_MAP).includes(l) ? l : null)
    if (key) mapped.push(key)
    else unmapped.push(l)
  }
  return { mapped, unmapped }
}

async function main() {
  const args = process.argv.slice(2)
  const dirIdx = args.indexOf('--dir')
  const dir = dirIdx >= 0 ? args[dirIdx + 1] : '.'
  const force = args.includes('--force')

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }

  console.log(`Reading CSVs from: ${path.resolve(dir)}`)
  const reps = readCsv(dir, 'sales_reps.csv')
  const leads = readCsv(dir, 'leads.csv')
  const deals = readCsv(dir, 'deals.csv')
  const activities = readCsv(dir, 'activities.csv')
  console.log(`   reps=${reps.length} leads=${leads.length} deals=${deals.length} activities=${activities.length}`)

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  const client = await pool.connect()
  const warnings = []

  try {
    const existing = await client.query('SELECT COUNT(*)::int AS n FROM crm_leads')
    if (existing.rows[0].n > 0 && !force) {
      console.error(
        `crm_leads already has ${existing.rows[0].n} rows. Re-running would duplicate data. Use --force to append anyway.`
      )
      process.exit(1)
    }

    await client.query('BEGIN')

    // 1. Sales reps (upsert by name)
    console.log('1. Importing sales reps')
    for (const r of reps) {
      if (!str(r.name)) continue
      await client.query(
        `INSERT INTO crm_sales_reps (name, email, phone, active, created_at)
         VALUES ($1,$2,$3,$4, COALESCE($5::timestamptz, NOW()))
         ON CONFLICT (name) DO UPDATE SET active = EXCLUDED.active`,
        [str(r.name), str(r.email), str(r.phone), bool(r.active), ts(r.createdAt)]
      )
      console.log(`   ✓ ${r.name}`)
    }

    // 2. Leads (build MANUS id → new id map)
    console.log('2. Importing leads')
    const leadIdMap = new Map()
    const repNames = new Set(reps.map((r) => str(r.name)).filter(Boolean))
    for (const l of leads) {
      if (!str(l.companyName)) {
        warnings.push(`Lead ${l.id}: missing companyName — skipped`)
        continue
      }
      const status = LEAD_STATUSES.includes(l.status) ? l.status : 'New'
      if (status !== l.status) warnings.push(`Lead ${l.id} (${l.companyName}): unknown status "${l.status}" → New`)
      const { mapped, unmapped } = mapTrailerInterest(l.trailerInterest)
      if (unmapped.length) {
        warnings.push(`Lead ${l.id} (${l.companyName}): unmapped trailer interest ${unmapped.join(', ')} — dropped`)
      }
      const owner = str(l.assignedTo)
      if (owner && !repNames.has(owner)) {
        await client.query(
          `INSERT INTO crm_sales_reps (name, active) VALUES ($1, TRUE) ON CONFLICT (name) DO NOTHING`,
          [owner]
        )
        repNames.add(owner)
        warnings.push(`Lead ${l.id}: auto-created sales rep "${owner}"`)
      }
      const res = await client.query(
        `INSERT INTO crm_leads
           (company_name, contact_name, email, phone, region, state, status, source, assigned_to,
            trailer_interest, notes, estimated_monthly_value, is_archived, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
                 COALESCE($14::timestamptz, NOW()), COALESCE($15::timestamptz, NOW()))
         RETURNING id`,
        [
          str(l.companyName),
          str(l.contactName),
          str(l.email),
          str(l.phone),
          str(l.region),
          str(l.state) ? str(l.state).toUpperCase().slice(0, 2) : null,
          status,
          str(l.source),
          owner,
          JSON.stringify(mapped),
          str(l.notes),
          num(l.estimatedMonthlyValue),
          bool(l.isArchived) || status === 'Lost',
          ts(l.createdAt),
          ts(l.updatedAt),
        ]
      )
      leadIdMap.set(String(l.id), res.rows[0].id)
      console.log(`   ✓ ${l.companyName} (${l.id} → ${res.rows[0].id})`)
    }

    // 3. Deals (remap leadId, map trailer type)
    console.log('3. Importing deals')
    const dealIdMap = new Map()
    for (const d of deals) {
      const newLeadId = leadIdMap.get(String(d.leadId))
      if (!newLeadId) {
        warnings.push(`Deal ${d.id} (${d.companyName}): parent lead ${d.leadId} not found — skipped`)
        continue
      }
      const trailerType = MANUS_TYPE_MAP[d.trailerType] ?? d.trailerType
      if (!Object.values(MANUS_TYPE_MAP).includes(trailerType)) {
        warnings.push(`Deal ${d.id} (${d.companyName}): unknown trailer type "${d.trailerType}" — skipped`)
        continue
      }
      const stage = DEAL_STAGES.includes(d.stage) ? d.stage : 'Qualification'
      if (stage !== d.stage) warnings.push(`Deal ${d.id}: unknown stage "${d.stage}" → Qualification`)
      const res = await client.query(
        `INSERT INTO crm_deals
           (lead_id, company_name, trailer_type, quantity, monthly_rate_per_unit, rental_term_months,
            is_month_to_month, region, stage, probability, assigned_to, expected_close_date,
            closed_at, cancelled_at, cancellation_reason, notes, is_archived, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
                 $13::timestamptz, $14::timestamptz, $15, $16, $17,
                 COALESCE($18::timestamptz, NOW()), COALESCE($19::timestamptz, NOW()))
         RETURNING id`,
        [
          newLeadId,
          str(d.companyName) ?? '—',
          trailerType,
          num(d.quantity, 1),
          num(d.monthlyRatePerUnit),
          num(d.rentalTermMonths, 12),
          bool(d.isMonthToMonth),
          str(d.region),
          stage,
          num(d.probability, 25),
          str(d.assignedTo),
          str(d.expectedCloseDate),
          ts(d.closedAt),
          ts(d.cancelledAt),
          str(d.cancellationReason),
          str(d.notes),
          bool(d.isArchived) || stage === 'Closed Lost',
          ts(d.createdAt),
          ts(d.updatedAt),
        ]
      )
      dealIdMap.set(String(d.id), res.rows[0].id)
      console.log(`   ✓ ${d.companyName} ${d.trailerType} ×${d.quantity} [${stage}] (${d.id} → ${res.rows[0].id})`)
    }

    // 4. Activities (remap relatedToId via lead/deal maps)
    console.log('4. Importing activities')
    let actCount = 0
    for (const a of activities) {
      const map = a.relatedToType === 'Deal' ? dealIdMap : leadIdMap
      const newRelatedId = map.get(String(a.relatedToId))
      if (!newRelatedId) {
        warnings.push(`Activity ${a.id}: related ${a.relatedToType} ${a.relatedToId} not found — skipped`)
        continue
      }
      await client.query(
        `INSERT INTO crm_activities
           (related_to_type, related_to_id, activity_type, notes, assigned_to,
            follow_up_at, status, completed_at, created_at)
         VALUES ($1,$2,$3,$4,$5,$6::timestamptz,$7,$8::timestamptz, COALESCE($9::timestamptz, NOW()))`,
        [
          a.relatedToType === 'Deal' ? 'Deal' : 'Lead',
          newRelatedId,
          str(a.activityType) ?? 'Note',
          str(a.notes),
          str(a.assignedTo),
          ts(a.followUpAt),
          a.status === 'Pending' ? 'Pending' : 'Completed',
          ts(a.completedAt),
          ts(a.createdAt),
        ]
      )
      actCount++
    }
    console.log(`   ✓ ${actCount} activities`)

    await client.query('COMMIT')
    console.log('Import committed.')

    if (warnings.length) {
      console.log('\nWarnings:')
      warnings.forEach((w) => console.log(`   ⚠ ${w}`))
    }

    const summary = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM crm_sales_reps) AS reps,
        (SELECT COUNT(*) FROM crm_leads) AS leads,
        (SELECT COUNT(*) FROM crm_deals) AS deals,
        (SELECT COUNT(*) FROM crm_activities) AS activities
    `)
    console.log('\nSummary:', summary.rows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Import failed, rolled back:', err)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

main()
