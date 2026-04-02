#!/usr/bin/env node
/**
 * Seed script: imports data from the 3 Excel files into the database.
 * Run: node scripts/seed-from-excel.mjs
 */

import pg from 'pg'
import XLSX from 'xlsx'

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required')
  process.exit(1)
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseDate(val) {
  if (!val) return null
  if (val instanceof Date) {
    // Guard against absurd dates from Excel serial numbers
    const year = val.getFullYear()
    if (year < 2000 || year > 2100) return null
    return val.toISOString().split('T')[0]
  }
  const s = String(val).trim()
  if (!s || s === '0') return null
  // Excel serial number — convert
  if (/^\d{5}$/.test(s)) {
    const epoch = new Date(1899, 11, 30)
    const d = new Date(epoch.getTime() + Number(s) * 86400000)
    const year = d.getFullYear()
    if (year < 2000 || year > 2100) return null
    return d.toISOString().split('T')[0]
  }
  const d = new Date(s)
  if (isNaN(d.getTime())) return null
  const year = d.getFullYear()
  if (year < 2000 || year > 2100) return null
  return d.toISOString().split('T')[0]
}

function parseNum(val) {
  if (val === null || val === undefined || val === '') return null
  const n = Number(val)
  return isNaN(n) ? null : n
}

function clean(val) {
  if (val === null || val === undefined) return null
  const s = String(val).trim()
  return s === '' || s === '0' || s === 'N/A' || s === 'n/a' || s === 'NA' ? null : s
}

function last4(val) {
  if (!val) return null
  const s = String(val).replace(/\D/g, '')
  return s.length >= 4 ? s.slice(-4) : s || null
}

// ---------------------------------------------------------------------------
// 1. Import Customers from Rental Applications
// ---------------------------------------------------------------------------

async function importCustomers() {
  const wb = XLSX.readFile('/home/dfrvbee/Pictures/SEEK_EQUIPMENT_RENTAL_APPLICATI2026-04-02_13_50_32.xlsx')
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws)

  // Skip test entries (Unilink Transportation)
  const realRows = rows.filter(r => {
    const name = String(r['Individual or Company Name'] || '').toLowerCase()
    return !name.includes('unilink')
  })

  const customerMap = new Map() // company_name -> customer_id

  for (const r of realRows) {
    const companyName = clean(r['Individual or Company Name'])
    if (!companyName) continue
    if (customerMap.has(companyName.toLowerCase())) continue

    const result = await pool.query(
      `INSERT INTO customers (
        company_name, contact_first_name, contact_last_name, phone, email,
        business_type, state_formed, address, city, state, zip,
        insurance_company, insurance_phone, ap_email, ap_phone, status, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'active',$16)
      RETURNING id`,
      [
        companyName,
        clean(r['First Name']),
        clean(r['Last Name']),
        clean(r['Phone Number']),
        clean(r['Email Address']),
        clean(r['Business information']),
        clean(r['State Entity Formed']),
        clean(r['Street Address']),
        clean(r['City']),
        clean(r['State / Province']),
        clean(r['Postal/Zip Code']),
        clean(r['Insurance Company']),
        null,
        clean(r['A/P  Email']),
        clean(r['A/P Phone Number']),
        null,
      ]
    )
    customerMap.set(companyName.toLowerCase(), result.rows[0].id)
    console.log(`  Customer: ${companyName} (id=${result.rows[0].id})`)
  }

  return customerMap
}

// ---------------------------------------------------------------------------
// 2. Update ACH authorization status
// ---------------------------------------------------------------------------

async function importACH() {
  const wb = XLSX.readFile('/home/dfrvbee/Pictures/SEEK_ACH_Debits_Authorization_F2026-04-02_13_51_46.xlsx')
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws)

  // Skip test entries
  const realRows = rows.filter(r => {
    const name = String(r['Company Name'] || r['Name'] || '').toLowerCase()
    return !name.includes('unilink')
  })

  for (const r of realRows) {
    const companyName = clean(r['Company Name']) || clean(r['Name'])
    if (!companyName) continue

    const bankName = clean(r['Depository Name'])
    const accountNum = clean(r['Account Number'])
    const l4 = last4(accountNum)

    await pool.query(
      `UPDATE customers SET ach_authorized = true, ach_bank_name = $1, ach_account_last4 = $2
       WHERE LOWER(company_name) = LOWER($3)`,
      [bankName, l4, companyName]
    )
    console.log(`  ACH: ${companyName} (bank: ${bankName}, last4: ${l4})`)
  }
}

// ---------------------------------------------------------------------------
// 3. Import Fleet Units from Tracking Sheet
// ---------------------------------------------------------------------------

async function importFleetUnits(customerMap) {
  const wb = XLSX.readFile('/home/dfrvbee/Pictures/Seek Equipment Rentals Tracking.xlsx')
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })

  // Skip header row, process until blank rows
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const status = clean(row[0])
    const unitNumber = clean(row[1])
    const vin = clean(row[2])

    if (!unitNumber) continue

    const assignedTo = clean(row[3])
    const rentDate = parseDate(row[4])
    const dueDate = clean(row[5])
    const rentTotal = parseNum(row[6])
    const depositTotal = parseNum(row[7])
    const pendingDeposit = parseNum(row[8])

    // Determine trailer type from unit number prefix
    let trailerType = 'sand_chassis'
    if (unitNumber.startsWith('BD')) trailerType = 'belly_dump'
    else if (unitNumber.startsWith('SH')) trailerType = 'sand_hopper'
    else if (unitNumber.startsWith('DV')) trailerType = 'dry_van'
    else if (unitNumber.startsWith('FB')) trailerType = 'flatbed'
    else if (unitNumber.startsWith('TK')) trailerType = 'tank'

    // Map status
    const dbStatus = status?.toLowerCase() === 'rented' ? 'rented' : 'available'

    // Find customer_id
    let customerId = null
    if (assignedTo) {
      // Try exact match first, then fuzzy
      for (const [key, id] of customerMap) {
        if (key === assignedTo.toLowerCase() || key.includes(assignedTo.toLowerCase()) || assignedTo.toLowerCase().includes(key.split(' ')[0])) {
          customerId = id
          break
        }
      }
    }

    // Special handling: Hammerhead is not in rental applications
    if (assignedTo && assignedTo.toLowerCase().includes('hammerhead') && !customerId) {
      // Check if already inserted
      const existing = await pool.query("SELECT id FROM customers WHERE LOWER(company_name) = 'hammerhead'")
      if (existing.rows.length === 0) {
        const res = await pool.query(
          "INSERT INTO customers (company_name, status) VALUES ('Hammerhead', 'active') RETURNING id"
        )
        customerId = res.rows[0].id
        customerMap.set('hammerhead', customerId)
        console.log(`  Created customer: Hammerhead (id=${customerId})`)
      } else {
        customerId = existing.rows[0].id
        customerMap.set('hammerhead', customerId)
      }
    }

    // EJ's -> E&J'S LLC
    if (assignedTo && assignedTo.toLowerCase().includes('ej') && !customerId) {
      for (const [key, id] of customerMap) {
        if (key.includes('e&j') || key.includes('ej')) {
          customerId = id
          break
        }
      }
    }

    await pool.query(
      `INSERT INTO fleet_units (
        unit_number, trailer_type, vin, status, rented_to, rental_rate,
        customer_id, deposit_total, pending_deposit, rent_start_date, rent_due_day,
        created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, NOW(), NOW())`,
      [
        unitNumber,
        trailerType,
        vin,
        dbStatus,
        assignedTo,
        rentTotal || null,
        customerId,
        depositTotal || null,
        pendingDeposit || null,
        rentDate,
        dueDate,
      ]
    )
    console.log(`  Unit: ${unitNumber} (${dbStatus}) -> ${assignedTo || 'n/a'}`)
  }

  // Also add the returned unit from row 46
  // E&L Transport - returned, pending deposit
  const elCustomer = await pool.query("SELECT id FROM customers WHERE LOWER(company_name) LIKE '%e&l%' OR LOWER(company_name) LIKE '%e%l transport%'")
  let elId = null
  if (elCustomer.rows.length === 0) {
    const res = await pool.query(
      "INSERT INTO customers (company_name, status, notes) VALUES ('E&L Transport', 'active', 'Returned unit, pending deposit refund') RETURNING id"
    )
    elId = res.rows[0].id
    console.log(`  Created customer: E&L Transport (id=${elId})`)
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Seeding from Excel files ===\n')

  console.log('1. Importing customers from rental applications...')
  const customerMap = await importCustomers()

  console.log('\n2. Updating ACH authorization...')
  await importACH()

  console.log('\n3. Importing fleet units from tracking sheet...')
  await importFleetUnits(customerMap)

  console.log('\n=== Done! ===')
  await pool.end()
}

main().catch(e => {
  console.error('Error:', e)
  process.exit(1)
})
