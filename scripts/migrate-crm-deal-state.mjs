import pg from 'pg'

const { Pool } = pg

// Adds a `state` column to crm_deals (US state code, mirrors crm_leads.state).
// Idempotent: safe to re-run.

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  const client = await pool.connect()
  try {
    console.log('Adding crm_deals.state')
    await client.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS state VARCHAR(2)`)
    console.log('Done.')
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
