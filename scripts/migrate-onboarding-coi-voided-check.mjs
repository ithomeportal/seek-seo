import pg from 'pg'

const { Pool } = pg

// Adds the columns backing Bruno's 2026-06-09 onboarding feedback:
//  - Voided Check / Checking Account Deposit Slip upload under the ACH section
//    (ach_voided_check_url already exists; this adds its uploaded-at timestamp).
//  - New "Insurance / COI" (Certificate of Insurance) category supporting
//    multiple uploaded files (coi_documents jsonb array + coi_uploaded_at).
// Idempotent: safe to re-run (IF NOT EXISTS everywhere).

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    console.log('1. ach_voided_check_uploaded_at')
    await client.query(`
      ALTER TABLE customer_onboarding_applications
        ADD COLUMN IF NOT EXISTS ach_voided_check_uploaded_at TIMESTAMPTZ
    `)

    console.log('2. coi_documents (jsonb array)')
    await client.query(`
      ALTER TABLE customer_onboarding_applications
        ADD COLUMN IF NOT EXISTS coi_documents JSONB NOT NULL DEFAULT '[]'::jsonb
    `)

    console.log('3. coi_uploaded_at')
    await client.query(`
      ALTER TABLE customer_onboarding_applications
        ADD COLUMN IF NOT EXISTS coi_uploaded_at TIMESTAMPTZ
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
