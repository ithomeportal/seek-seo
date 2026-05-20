import pg from 'pg'
import fs from 'node:fs'

const { Pool } = pg

const SEED_PATH = '/tmp/depr_seed.json'

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    console.log('1. Creating depreciation_records table')
    await client.query(`
      CREATE TABLE IF NOT EXISTS depreciation_records (
        id SERIAL PRIMARY KEY,
        fleet_unit_id INTEGER REFERENCES fleet_units(id) ON DELETE SET NULL,
        category VARCHAR(32) NOT NULL,
        unit_number VARCHAR(32) NOT NULL,
        item_description TEXT,
        date_acquired DATE NOT NULL,
        cost NUMERIC(14,2) NOT NULL CHECK (cost >= 0),
        depr_years SMALLINT NOT NULL DEFAULT 3 CHECK (depr_years > 0),
        prior_year_end_accumulated NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (prior_year_end_accumulated >= 0),
        sold_date DATE,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT depreciation_records_category_check CHECK (category::text = ANY (ARRAY[
          'chassis'::varchar, 'tankers'::varchar, 'belly_dumps'::varchar,
          'sand_hoppers'::varchar, 'dry_vans'::varchar, 'flat_beds'::varchar,
          'vehicles'::varchar, 'other'::varchar
        ]::text[]))
      )
    `)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_depreciation_records_category ON depreciation_records(category)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_depreciation_records_fleet_unit_id ON depreciation_records(fleet_unit_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_depreciation_records_date_acquired ON depreciation_records(date_acquired)`)

    if (!fs.existsSync(SEED_PATH)) {
      console.log(`No seed file at ${SEED_PATH}; skipping seed.`)
      await client.query('COMMIT')
      return
    }

    const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf-8'))
    console.log(`2. Seeding ${seed.length} depreciation records`)

    // Fetch fleet_units once for FK resolution
    const fu = await client.query('SELECT id, unit_number FROM fleet_units')
    const fuByUnit = new Map(fu.rows.map((r) => [r.unit_number.toUpperCase(), r.id]))

    let inserted = 0
    let skipped = 0
    for (const row of seed) {
      // Skip if already inserted (idempotent: keyed on unit_number + date_acquired)
      const existing = await client.query(
        `SELECT id FROM depreciation_records WHERE unit_number = $1 AND date_acquired = $2`,
        [row.unit_number, row.date_acquired]
      )
      if (existing.rowCount > 0) {
        skipped++
        continue
      }

      const fleetUnitId = fuByUnit.get(row.unit_number.toUpperCase()) ?? null

      await client.query(
        `INSERT INTO depreciation_records (
          fleet_unit_id, category, unit_number, item_description, date_acquired,
          cost, depr_years, prior_year_end_accumulated, sold_date, notes,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [
          fleetUnitId,
          row.category,
          row.unit_number,
          row.item_description || null,
          row.date_acquired,
          row.cost,
          row.depr_years,
          row.prior_year_end_accumulated,
          row.sold_date || null,
          row.notes || null,
        ]
      )
      inserted++
    }
    console.log(`   Inserted: ${inserted}, Skipped (already exist): ${skipped}`)

    const summary = await client.query(`
      SELECT category, COUNT(*)::int AS cnt,
             ROUND(SUM(cost)::numeric, 2) AS total_cost,
             ROUND(SUM(prior_year_end_accumulated)::numeric, 2) AS prior_accum
      FROM depreciation_records GROUP BY category ORDER BY category
    `)
    console.log('Summary by category:')
    summary.rows.forEach((r) =>
      console.log(`  ${r.category.padEnd(12)} ${String(r.cnt).padStart(3)} rows  cost=$${r.total_cost}  prior_accum=$${r.prior_accum}`)
    )

    await client.query('COMMIT')
    console.log('Migration complete.')
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
