import pg from 'pg'

const { Pool } = pg

// Creates the CRM tables (ported from the sales team's MANUS trailer_crm app).
// Fleet is NOT duplicated here — the CRM reads the existing fleet_units table.
// Idempotent: safe to re-run (IF NOT EXISTS everywhere).

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    console.log('1. Creating crm_sales_reps')
    await client.query(`
      CREATE TABLE IF NOT EXISTS crm_sales_reps (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(128) NOT NULL UNIQUE,
        email       VARCHAR(320),
        phone       VARCHAR(32),
        active      BOOLEAN NOT NULL DEFAULT TRUE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    console.log('2. Creating crm_leads')
    await client.query(`
      CREATE TABLE IF NOT EXISTS crm_leads (
        id                      SERIAL PRIMARY KEY,
        company_name            VARCHAR(255) NOT NULL,
        contact_name            VARCHAR(128),
        email                   VARCHAR(320),
        phone                   VARCHAR(32),
        region                  VARCHAR(64),
        state                   VARCHAR(2),
        status                  VARCHAR(32) NOT NULL DEFAULT 'New'
          CHECK (status IN ('New','Contacted','Qualified','Proposal Sent','Won','Lost')),
        source                  VARCHAR(64),
        assigned_to             VARCHAR(128),
        trailer_interest        JSONB NOT NULL DEFAULT '[]'::jsonb,
        notes                   TEXT,
        estimated_monthly_value NUMERIC(12,2) DEFAULT 0,
        is_archived             BOOLEAN NOT NULL DEFAULT FALSE,
        created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(status)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_crm_leads_assigned ON crm_leads(assigned_to)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_crm_leads_archived ON crm_leads(is_archived)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_crm_leads_created ON crm_leads(created_at DESC)`)

    console.log('3. Creating crm_deals')
    await client.query(`
      CREATE TABLE IF NOT EXISTS crm_deals (
        id                    SERIAL PRIMARY KEY,
        lead_id               INTEGER NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
        company_name          VARCHAR(255) NOT NULL,
        trailer_type          VARCHAR(32) NOT NULL
          CHECK (trailer_type IN ('sand_chassis','sand_hopper','belly_dump','tank','dry_van','flatbed')),
        quantity              INTEGER NOT NULL DEFAULT 1,
        monthly_rate_per_unit NUMERIC(12,2) NOT NULL DEFAULT 0,
        rental_term_months    INTEGER NOT NULL DEFAULT 12,
        is_month_to_month     BOOLEAN NOT NULL DEFAULT FALSE,
        region                VARCHAR(64),
        stage                 VARCHAR(32) NOT NULL DEFAULT 'Qualification'
          CHECK (stage IN ('Qualification','Proposal','Negotiation','Closed Won','Closed Lost')),
        probability           INTEGER NOT NULL DEFAULT 25,
        assigned_to           VARCHAR(128),
        expected_close_date   VARCHAR(32),
        closed_at             TIMESTAMPTZ,
        cancelled_at          TIMESTAMPTZ,
        cancellation_reason   VARCHAR(255),
        notes                 TEXT,
        is_archived           BOOLEAN NOT NULL DEFAULT FALSE,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_crm_deals_lead ON crm_deals(lead_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON crm_deals(stage)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_crm_deals_assigned ON crm_deals(assigned_to)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_crm_deals_archived ON crm_deals(is_archived)`)

    console.log('4. Creating crm_activities')
    await client.query(`
      CREATE TABLE IF NOT EXISTS crm_activities (
        id              SERIAL PRIMARY KEY,
        related_to_type VARCHAR(8) NOT NULL CHECK (related_to_type IN ('Lead','Deal')),
        related_to_id   INTEGER NOT NULL,
        activity_type   VARCHAR(16) NOT NULL
          CHECK (activity_type IN ('Call','Email','Meeting','Note','Follow-up')),
        notes           TEXT,
        assigned_to     VARCHAR(128),
        follow_up_at    TIMESTAMPTZ,
        status          VARCHAR(16) NOT NULL DEFAULT 'Completed'
          CHECK (status IN ('Pending','Completed')),
        completed_at    TIMESTAMPTZ,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_crm_act_related ON crm_activities(related_to_type, related_to_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_crm_act_pending ON crm_activities(status) WHERE status = 'Pending'`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_crm_act_assigned ON crm_activities(assigned_to)`)

    console.log('5. Seeding sales reps (E. Mendoza, R. Perales)')
    await client.query(`
      INSERT INTO crm_sales_reps (name, active)
      VALUES ('E. Mendoza', TRUE), ('R. Perales', TRUE)
      ON CONFLICT (name) DO NOTHING
    `)

    await client.query('COMMIT')
    console.log('Migration complete.')

    const summary = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM crm_sales_reps) AS reps,
        (SELECT COUNT(*) FROM crm_leads) AS leads,
        (SELECT COUNT(*) FROM crm_deals) AS deals,
        (SELECT COUNT(*) FROM crm_activities) AS activities
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
