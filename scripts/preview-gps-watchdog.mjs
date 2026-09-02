/**
 * Render the exact daily GPS watchdog email against the LIVE database and write
 * it to a file. Sends nothing — this is how the 8 AM email is reviewed before
 * it ever ships, and how it is re-checked after any change to the thresholds.
 *
 *   node scripts/preview-gps-watchdog.mjs [outfile]
 *
 * The classifier and the HTML builder are re-implemented nowhere: this script
 * imports the same TypeScript modules the route uses, transpiled on the fly, so
 * a preview that looks right cannot diverge from what production sends.
 */
import pg from 'pg'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import ts from 'typescript'
import { createRequire } from 'node:module'

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const p = path.join(process.cwd(), file)
    if (!fs.existsSync(p)) continue
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const trimmed = line.trim()
      if (trimmed === '' || trimmed.startsWith('#') || !trimmed.includes('=')) continue
      const i = trimmed.indexOf('=')
      const key = trimmed.slice(0, i).trim()
      const value = trimmed.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')
      if (!(key in process.env)) process.env[key] = value
    }
  }
}

/**
 * Load `src/lib/*.ts` by transpiling to CJS in a temp dir and requiring it.
 *
 * The point is that the preview imports the SAME modules the route does — a
 * preview built from a re-implementation would look right while production
 * sent something else.
 */
function loadLibModules(names) {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seek-gps-preview-'))
  for (const name of names) {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/lib', `${name}.ts`), 'utf8')
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    })
    // `@/lib/x` only ever resolves to a sibling here, so a literal rewrite is
    // enough and avoids hand-rolling a module resolver.
    fs.writeFileSync(
      path.join(outDir, `${name}.cjs`),
      outputText.replace(/require\("@\/lib\/([\w-]+)"\)/g, 'require("./$1.cjs")'),
      'utf8'
    )
  }
  const req = createRequire(path.join(outDir, 'entry.cjs'))
  return Object.fromEntries(names.map((name) => [name, req(`./${name}.cjs`)]))
}

function stripSslMode(url) {
  return url
    .replace(/([?&])sslmode=[^&]*/gi, '$1')
    .replace(/[?&]$/, '')
    .replace(/\?&/, '?')
    .replace(/&&/g, '&')
}

async function main() {
  loadEnv()
  const outfile = process.argv[2] ?? 'gps-watchdog-preview.html'

  const mods = loadLibModules(['gps-health', 'gps-watchdog-email'])
  const health = mods['gps-health']
  const email = mods['gps-watchdog-email']

  const raw = (process.env.DATABASE_URL ?? '').trim()
  if (raw === '') throw new Error('DATABASE_URL is not set')

  const pool = new pg.Pool({
    connectionString: stripSslMode(raw),
    ssl: { rejectUnauthorized: false },
    max: 2,
  })
  const { rows } = await pool.query(health.GPS_HEALTH_QUERY)
  await pool.end()

  const report = health.buildHealthReport(rows)

  console.log('Subject:', email.watchdogSubject(report))
  console.log('')
  console.log('Counts:', report.counts)
  console.log('Totals:', report.totals)
  console.log('Feed down:', report.feedDown, '| last sync', report.lastSyncAt)
  console.log('')
  console.table(
    report.problems.map((u) => ({
      unit: u.unitNumber,
      status: u.status,
      tier: u.tier,
      age: health.formatAge(u.ageHours),
      lastFix: u.lastGpsTime,
      rentedTo: u.rentedTo,
    }))
  )

  fs.writeFileSync(outfile, email.watchdogHtml(report), 'utf8')
  console.log(`\nHTML written to ${outfile} (nothing was sent)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
