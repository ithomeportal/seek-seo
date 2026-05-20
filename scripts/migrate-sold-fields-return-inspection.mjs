import pg from 'pg'

const { Pool } = pg

// Parsed by hand from the 11 sale-history blobs that were jammed into fleet_units.rented_to.
// Each entry: [unit_number, sold_date YYYY-MM-DD, sale_price NUMERIC, sale_buyer, sale_notes]
// Source: the existing rented_to values discovered 2026-05-20 — see project_bruno_feedback_2026_05_20 memory.
const SOLD_BACKFILL = [
  ['CH010', '2024-03-11', 25000.00, 'Jose Luis Rodriguez', 'Sold via Mencar LLC. No Cost of Sale.'],
  ['CH020', '2024-03-11', 25000.00, 'Jose Luis Rodriguez', 'Sold via Mencar LLC. No Cost of Sale.'],
  ['CH040', '2024-06-12', 22500.00, 'Yamil LLC (Jose Luis Rodriguez)', 'Sold via Mencar LLC. No Cost of Sale.'],
  ['CH045', '2024-01-11', 25000.00, 'Jose Luis Rodriguez', 'Sold via Mencar LLC. No Cost of Sale.'],
  ['CH050', '2024-06-12', 22500.00, 'Yamil LLC (Jose Luis Rodriguez)', 'Sold via Mencar LLC. No Cost of Sale.'],
  ['CH065', '2024-01-11', 25000.00, 'Jose Luis Rodriguez', 'Sold via Mencar LLC. No Cost of Sale.'],
  ['CH070', '2024-01-11', 25000.00, 'Jose Luis Rodriguez', 'Sold via Mencar LLC. No Cost of Sale.'],
  ['CH075', '2023-09-24', 30400.00, 'TMSI', "Sold via Mencar LLC. Fees $1,750.00; Net Proceeds $28,650.00."],
  ['CH160', '2023-11-28', 32000.00, 'Fred C. Smith and Lakeisha Davis', 'Sold via Mencar LLC. Paid with Cashiers Check.'],
  ['TC045', '2026-01-13', 14500.00, 'Southern Texas Fuel Transport LLC', 'No cost of sale.'],
  ['TC50',  '2025-08-07', 17500.00, 'ECCO Environmental Inc. (Subhan Vahora)', 'No Cost of Sale.'],
]

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    console.log('1. Adding sold_date, sale_price, sale_buyer, sale_notes columns')
    await client.query(`
      ALTER TABLE fleet_units
      ADD COLUMN IF NOT EXISTS sold_date DATE,
      ADD COLUMN IF NOT EXISTS sale_price NUMERIC(12,2),
      ADD COLUMN IF NOT EXISTS sale_buyer TEXT,
      ADD COLUMN IF NOT EXISTS sale_notes TEXT
    `)

    console.log('2. Extending status CHECK with return_inspection')
    await client.query(`ALTER TABLE fleet_units DROP CONSTRAINT IF EXISTS fleet_units_status_check`)
    await client.query(`
      ALTER TABLE fleet_units
      ADD CONSTRAINT fleet_units_status_check CHECK (
        status::text = ANY (ARRAY[
          'available'::varchar,
          'rented'::varchar,
          'damaged'::varchar,
          'for_sale'::varchar,
          'maintenance'::varchar,
          'sold'::varchar,
          'make_ready'::varchar,
          'return_inspection'::varchar
        ]::text[])
      )
    `)

    console.log(`3. Backfilling ${SOLD_BACKFILL.length} sold units (sale data was in rented_to)`)
    let updated = 0
    let missing = 0
    for (const [unitNumber, soldDate, salePrice, saleBuyer, saleNotes] of SOLD_BACKFILL) {
      const r = await client.query(
        `UPDATE fleet_units
         SET sold_date = $2,
             sale_price = $3,
             sale_buyer = $4,
             sale_notes = $5,
             rented_to = NULL,
             rented_to_contact = NULL,
             updated_at = NOW()
         WHERE unit_number = $1`,
        [unitNumber, soldDate, salePrice, saleBuyer, saleNotes]
      )
      if (r.rowCount === 0) {
        console.log(`   - SKIP ${unitNumber} (not found in DB)`)
        missing++
      } else {
        updated++
        console.log(`   ✓ ${unitNumber}  ${soldDate}  $${salePrice.toLocaleString('en-US')}  → ${saleBuyer}`)
      }
    }
    console.log(`   Updated: ${updated}, Missing: ${missing}`)

    await client.query('COMMIT')
    console.log('Migration complete.')

    const summary = await client.query(`
      SELECT COUNT(*) FILTER (WHERE status = 'sold') AS sold_count,
             COUNT(*) FILTER (WHERE sold_date IS NOT NULL) AS sold_dated,
             COUNT(*) FILTER (WHERE sale_price IS NOT NULL) AS priced,
             COUNT(*) AS total
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
