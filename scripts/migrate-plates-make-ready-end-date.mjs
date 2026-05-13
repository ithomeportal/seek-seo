import pg from 'pg'

const { Pool } = pg

const PLATES = [
  // Belly Dumps
  ['BD05', '566-0275', '2031-02-28'],
  ['BD10', '566-0278', '2031-02-28'],
  ['BD15', '566-0272', '2031-02-28'],
  ['BD20', '566-0280', '2031-02-28'],
  ['BD25', '566-0279', '2031-02-28'],
  ['BD30', '566-0274', '2031-02-28'],
  ['BD35', '566-0273', '2031-02-28'],
  ['BD40', '566-0281', '2031-02-28'],
  ['BD45', '566-0277', '2031-02-28'],
  ['BD50', '566-0276', '2031-02-28'],
  // Sand Chassis
  ['CH005', '563-5840', '2031-02-28'],
  ['CH015', '563-5842', '2031-02-28'],
  ['CH025', '563-5841', '2031-02-28'],
  ['CH030', '563-5839', '2031-02-28'],
  ['CH035', '563-5837', '2031-02-28'],
  ['CH055', '563-5838', '2031-02-28'],
  ['CH060', '564-1574', null],
  ['CH080', '563-6192', '2031-02-28'],
  ['CH085', '552-0800', '2030-02-28'],
  ['CH090', '552-0801', '2030-02-28'],
  ['CH095', '563-6194', '2031-02-28'],
  ['CH100', '563-7147', null],
  ['CH105', '552-0802', '2030-02-28'],
  ['CH110', '552-0804', '2030-02-28'],
  ['CH115', '563-6195', '2031-02-28'],
  ['CH120', '552-0803', '2030-02-28'],
  ['CH125', '552-0806', '2030-02-28'],
  ['CH130', '552-0807', '2030-02-28'],
  ['CH135', '552-0808', '2030-02-28'],
  ['CH140', '552-0809', '2030-02-28'],
  ['CH145', '563-6196', '2031-02-28'],
  ['CH150', '563-6197', '2031-02-28'],
  ['CH155', '563-7055', null],
  ['CH165', '563-7054', null],
  // Tanks
  ['TC005', '552-0095', '2030-02-28'],
  ['TC010', '552-0097', '2030-02-28'],
  ['TC015', '552-0096', '2030-02-28'],
  ['TC020', '552-0099', '2030-02-28'],
  ['TC025', '554-6458', '2030-02-28'],
  ['TC030', '554-6457', '2030-02-28'],
  ['TC035', '554-6456', '2030-02-28'],
  ['TC040', '554-6455', '2030-02-28'],
  ['TC045', '554-6453', '2030-02-28'],
  ['TC050', '554-6451', '2030-02-28'],
]

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    console.log('1. Adding plate_number, plate_expiration, rent_end_date columns')
    await client.query(`
      ALTER TABLE fleet_units
      ADD COLUMN IF NOT EXISTS plate_number VARCHAR(32),
      ADD COLUMN IF NOT EXISTS plate_expiration DATE,
      ADD COLUMN IF NOT EXISTS rent_end_date DATE
    `)

    console.log('2. Extending status CHECK constraint with make_ready')
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
          'make_ready'::varchar
        ]::text[])
      )
    `)

    console.log(`3. Backfilling ${PLATES.length} plates`)
    let updated = 0
    let missing = 0
    for (const [unitNumber, plate, exp] of PLATES) {
      const r = await client.query(
        `UPDATE fleet_units
         SET plate_number = $2, plate_expiration = $3, updated_at = NOW()
         WHERE unit_number = $1`,
        [unitNumber, plate, exp]
      )
      if (r.rowCount === 0) {
        console.log(`   - SKIP ${unitNumber} (not found in DB)`)
        missing++
      } else {
        updated++
      }
    }
    console.log(`   Updated: ${updated}, Missing: ${missing}`)

    await client.query('COMMIT')
    console.log('Migration complete.')

    const summary = await client.query(`
      SELECT COUNT(*) FILTER (WHERE plate_number IS NOT NULL) AS plated,
             COUNT(*) FILTER (WHERE plate_expiration IS NOT NULL) AS dated,
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
