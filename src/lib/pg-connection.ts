/**
 * Shared Postgres connection-string handling for every Aiven pool in this app.
 *
 * Exists because the sslmode rule below was implemented twice (qb-db.ts,
 * fmcsa-db.ts) and missed exactly once — in db.ts, the PRIMARY pool. That gap
 * took down every database-backed feature in production on 2026-07-21. Any new
 * pool MUST build its config here rather than hand-rolling a fourth copy.
 */

/**
 * Remove any `sslmode` parameter from a connection URL.
 *
 * node-postgres lets `sslmode` in the URL OVERRIDE the `ssl` object passed to
 * `new Pool()`, and treats `require` as an alias for `verify-full`. Aiven serves
 * a self-signed chain, so the connection then dies with
 * `SELF_SIGNED_CERT_IN_CHAIN` and every query throws.
 *
 * The param is stripped in ANY position, not just a trailing `?sslmode=require`,
 * and the separators are normalised afterwards so the remaining URL stays valid.
 *
 * This cannot be caught locally: `.env.local` carries no `sslmode`, so the bad
 * path only ever executes against the production URL.
 */
export function stripSslMode(url: string): string {
  return url
    .replace(/([?&])sslmode=[^&]*/gi, '$1')
    .replace(/[?&]$/, '')
    .replace(/\?&/, '?')
    .replace(/&&/g, '&')
}

/**
 * SSL settings for Aiven. `rejectUnauthorized: false` is required — Aiven's
 * chain is self-signed, so `verify-full` cannot succeed. Only meaningful when
 * the URL's own sslmode has been stripped first; see `stripSslMode`.
 */
export const AIVEN_SSL = { rejectUnauthorized: false } as const

/**
 * Build a `new Pool()` config from an env var, with `sslmode` stripped and
 * Aiven SSL applied. A missing env var yields an empty connection string, which
 * fails loudly on first query rather than silently connecting somewhere else.
 */
export function poolConfigFor(
  envVar: string,
  options: { max?: number; idleTimeoutMillis?: number } = {}
) {
  return {
    connectionString: stripSslMode(process.env[envVar] || ''),
    ssl: AIVEN_SSL,
    max: options.max ?? 5,
    idleTimeoutMillis: options.idleTimeoutMillis ?? 30000,
  }
}
