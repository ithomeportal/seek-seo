import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'
import { UTApi, UTFile } from 'uploadthing/server'

const { Pool } = pg

/**
 * One-time backfill: attach already-signed ACH / Lease PDFs to existing
 * onboarding rows so the admin Onboarding tab PDF icon works for them.
 *
 * Pre-2026-06-30 submissions never stored their signed PDF. The PDFs were
 * recovered from the rodney@/emendoza@ mailboxes by admin-ms
 * (scripts/seek-onboarding-fetch-pdfs.mjs → reports/seek-onboarding-pdfs/).
 * This uploads each to UploadThing and sets ach_pdf_url / lease_pdf_url.
 *
 * Two input modes:
 *   --manifest <path>   Read a manifest.json: [{ appId, type:'ach'|'lease', file }]
 *   --id N --type ach|lease --file <pdf>   Single document
 *
 * Idempotent: skips a row that already has a URL unless --force is passed.
 * Run with: node --env-file=.env.local scripts/backfill-onboarding-pdf.mjs --manifest <path>
 */

const COLUMN = { ach: 'ach_pdf_url', lease: 'lease_pdf_url' }
const FILE_PREFIX = { ach: 'ach-authorization', lease: 'lease-agreement' }

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--manifest') out.manifest = argv[++i]
    else if (a === '--id') out.id = Number(argv[++i])
    else if (a === '--type') out.type = argv[++i]
    else if (a === '--file') out.file = argv[++i]
    else if (a === '--force') out.force = true
  }
  return out
}

function loadJobs(args) {
  if (args.manifest) {
    const raw = JSON.parse(fs.readFileSync(args.manifest, 'utf8'))
    const base = path.dirname(args.manifest)
    return raw.map((j) => ({
      appId: j.appId,
      type: j.type,
      // manifest stores absolute or manifest-relative file paths
      file: path.isAbsolute(j.file) ? j.file : path.join(base, path.basename(j.file)),
      ref: j.ref ?? null,
    }))
  }
  if (args.id && args.type && args.file) {
    return [{ appId: args.id, type: args.type, file: args.file, ref: null }]
  }
  throw new Error('Provide --manifest <path> OR --id N --type ach|lease --file <pdf>')
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const jobs = loadJobs(args)

  if (!process.env.UPLOADTHING_TOKEN) throw new Error('UPLOADTHING_TOKEN not set')
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set')

  const utapi = new UTApi()
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  let done = 0
  let skipped = 0
  let failed = 0

  try {
    for (const job of jobs) {
      const tag = `#${job.appId} ${job.type}${job.ref ? ` ${job.ref}` : ''}`
      const col = COLUMN[job.type]
      if (!col) {
        console.error(`  ✗ ${tag}: unknown type "${job.type}"`)
        failed++
        continue
      }
      if (!fs.existsSync(job.file)) {
        console.error(`  ✗ ${tag}: file not found ${job.file}`)
        failed++
        continue
      }

      // Skip if already populated (unless --force).
      const existing = await pool.query(
        `SELECT ${col} AS url FROM customer_onboarding_applications WHERE id = $1`,
        [job.appId]
      )
      if (existing.rows.length === 0) {
        console.error(`  ✗ ${tag}: no application row id=${job.appId}`)
        failed++
        continue
      }
      if (existing.rows[0].url && !args.force) {
        console.log(`  • ${tag}: already has ${col}, skipping (use --force to overwrite)`)
        skipped++
        continue
      }

      const bytes = fs.readFileSync(job.file)
      const ref = job.ref ?? `app-${job.appId}`
      const filename = `${FILE_PREFIX[job.type]}-${ref}.pdf`
      const file = new UTFile([new Uint8Array(bytes)], filename, { type: 'application/pdf' })
      const res = await utapi.uploadFiles(file)
      const url = res?.data?.ufsUrl ?? res?.data?.url ?? null
      if (res?.error || !url) {
        console.error(`  ✗ ${tag}: upload failed — ${res?.error?.message ?? 'no url returned'}`)
        failed++
        continue
      }

      await pool.query(
        `UPDATE customer_onboarding_applications
            SET ${col} = $1, updated_at = NOW()
          WHERE id = $2`,
        [url, job.appId]
      )
      console.log(`  ✓ ${tag}: ${col} ← ${url}`)
      done++
    }
  } finally {
    await pool.end()
  }

  console.log(`\nBackfill complete: ${done} updated, ${skipped} skipped, ${failed} failed.`)
  if (failed) process.exitCode = 1
}

main().catch((e) => {
  console.error('Fatal:', e.message)
  process.exit(1)
})
