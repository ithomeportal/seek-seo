import pg from 'pg'

const { Pool } = pg

// Bruno's 2026-06-30 onboarding feedback: the admin Onboarding tab needs a
// clickable icon next to "ACH Authorization" and "Lease Agreement & Guaranty"
// that opens the signed PDF in a new tab. The signed PDFs were previously
// emailed-only and discarded; we now persist each one to UploadThing at
// submission and store its URL here.
// Idempotent: safe to re-run (IF NOT EXISTS everywhere).

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    console.log('1. ach_pdf_url')
    await client.query(`
      ALTER TABLE customer_onboarding_applications
        ADD COLUMN IF NOT EXISTS ach_pdf_url TEXT
    `)

    console.log('2. lease_pdf_url')
    await client.query(`
      ALTER TABLE customer_onboarding_applications
        ADD COLUMN IF NOT EXISTS lease_pdf_url TEXT
    `)

    await client.query('COMMIT')
    console.log('✓ Migration complete.')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('✗ Migration failed, rolled back:', err.message)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

main()
