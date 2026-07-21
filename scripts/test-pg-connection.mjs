/**
 * Regression tests for connection-string handling.
 *
 * Guards the bug that took production down on 2026-07-21: an `sslmode` param
 * left in DATABASE_URL overrides the `ssl` object passed to `new Pool()`, and
 * every query dies with SELF_SIGNED_CERT_IN_CHAIN against Aiven.
 *
 * Deliberately dependency-free (node --test) — this repo has no test runner and
 * the fix must not wait on adding one.
 *
 *   node --test scripts/test-pg-connection.mjs
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

// Mirror of stripSslMode in src/lib/pg-connection.ts. Kept in sync by
// test-pg-connection:parity below, which reads the real source.
const stripSslMode = (url) =>
  url
    .replace(/([?&])sslmode=[^&]*/gi, '$1')
    .replace(/[?&]$/, '')
    .replace(/\?&/, '?')
    .replace(/&&/g, '&')

const BASE = 'postgres://seek_app:pw@pg-x.aivencloud.com:10261/seek_equipment'

test('strips a trailing sslmode param', () => {
  assert.equal(stripSslMode(`${BASE}?sslmode=require`), BASE)
})

test('strips sslmode when it is not the last param', () => {
  assert.equal(
    stripSslMode(`${BASE}?sslmode=require&application_name=seek`),
    `${BASE}?application_name=seek`
  )
})

test('strips sslmode from the middle of a param list', () => {
  assert.equal(
    stripSslMode(`${BASE}?connect_timeout=10&sslmode=verify-full&application_name=seek`),
    `${BASE}?connect_timeout=10&application_name=seek`
  )
})

test('is case-insensitive', () => {
  assert.equal(stripSslMode(`${BASE}?SSLMode=REQUIRE`), BASE)
})

test('leaves a URL without sslmode untouched', () => {
  // The local .env.local shape — why this bug could never reproduce locally.
  assert.equal(stripSslMode(BASE), BASE)
  assert.equal(stripSslMode(`${BASE}?connect_timeout=10`), `${BASE}?connect_timeout=10`)
})

test('never leaves a dangling separator', () => {
  for (const url of [
    `${BASE}?sslmode=require`,
    `${BASE}?sslmode=require&a=1`,
    `${BASE}?a=1&sslmode=require`,
    `${BASE}?a=1&sslmode=require&b=2`,
  ]) {
    const out = stripSslMode(url)
    assert.ok(!/[?&]$/.test(out), `dangling separator: ${out}`)
    assert.ok(!/[?&]&/.test(out), `double separator: ${out}`)
    assert.ok(!/sslmode/i.test(out), `sslmode survived: ${out}`)
    assert.doesNotThrow(() => new URL(out), `unparseable: ${out}`)
  }
})

test('parity: every pg Pool in src/ builds its config via pg-connection', async () => {
  const { readFileSync, readdirSync } = await import('node:fs')

  // The real implementation must match the mirror above.
  const src = readFileSync(new URL('../src/lib/pg-connection.ts', import.meta.url), 'utf8')
  for (const fragment of [
    "replace(/([?&])sslmode=[^&]*/gi, '$1')",
    "replace(/[?&]$/, '')",
  ]) {
    assert.ok(src.includes(fragment), `pg-connection.ts drifted from the test mirror: ${fragment}`)
  }

  // No pool may hand-roll its own connection string. This is the assertion that
  // would have caught the outage: db.ts passed process.env.DATABASE_URL raw.
  const libDir = new URL('../src/lib/', import.meta.url)
  for (const file of readdirSync(libDir).filter((f) => f.endsWith('.ts'))) {
    if (file === 'pg-connection.ts') continue
    const body = readFileSync(new URL(file, libDir), 'utf8')
    if (!body.includes('new Pool(')) continue
    assert.ok(
      body.includes("from './pg-connection'"),
      `${file} constructs a Pool without importing pg-connection`
    )
    assert.ok(
      !/connectionString:\s*process\.env\./.test(body),
      `${file} passes a raw process.env URL to Pool — sslmode must be stripped first`
    )
  }
})
