import pg from 'pg'

const { Pool } = pg

// 2026-06-17 (Bruno feedback): add a new fleet status "lease_to_own" (label "Lease to Own").
// fleet_units.status is guarded by the fleet_units_status_check CHECK constraint, so the
// allowed-values list must be extended or inserts/updates with the new status fail.
async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    console.log('Extending status CHECK with lease_to_own')
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
          'return_inspection'::varchar,
          'lease_to_own'::varchar
        ]::text[])
      )
    `)

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
