import crypto from 'crypto'

/**
 * Stateless math-challenge "are you human" check for public forms.
 *
 * A challenge is `a + b = ?`. The server signs the expected answer + an expiry
 * into an HMAC token (no DB / session needed). The browser shows the sum and
 * sends back the token + the typed answer; the server re-verifies the HMAC,
 * the expiry, and the answer. Bots that POST directly to the API (never running
 * our JS) have no valid token, so they're rejected — this is why the check MUST
 * run server-side, not just in the form.
 *
 * Set FORM_CAPTCHA_SECRET in the environment. Falls back to CRON_SECRET or a
 * built-in default so the feature still works if the env var is missing.
 */

const TTL_MS = 10 * 60 * 1000 // 10 minutes
const MAX_TERM = 9 // single-digit sums — trivial for humans

function secret(): string {
  return process.env.FORM_CAPTCHA_SECRET || process.env.CRON_SECRET || 'seek-equipment-form-captcha-v1'
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', secret()).update(payload).digest('hex')
}

export interface Challenge {
  a: number
  b: number
  token: string
}

export function generateChallenge(): Challenge {
  const a = 1 + Math.floor(Math.random() * MAX_TERM)
  const b = 1 + Math.floor(Math.random() * MAX_TERM)
  const expires = Date.now() + TTL_MS
  const answer = a + b
  const payload = `${answer}.${expires}`
  const token = `${expires}.${sign(payload)}`
  return { a, b, token }
}

/**
 * Verify a submitted answer against its token. Returns true only when the HMAC
 * matches, the token hasn't expired, and the answer equals the signed sum.
 */
export function verifyChallenge(token: unknown, answer: unknown): boolean {
  if (typeof token !== 'string') return false
  const numAnswer = typeof answer === 'number' ? answer : parseInt(String(answer ?? ''), 10)
  if (!Number.isInteger(numAnswer)) return false

  const dot = token.indexOf('.')
  if (dot < 1) return false
  const expiresStr = token.slice(0, dot)
  const providedSig = token.slice(dot + 1)
  const expires = parseInt(expiresStr, 10)
  if (!Number.isInteger(expires) || Date.now() > expires) return false

  const expectedSig = sign(`${numAnswer}.${expires}`)
  // Timing-safe compare; lengths must match for timingSafeEqual.
  if (providedSig.length !== expectedSig.length) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(providedSig), Buffer.from(expectedSig))
  } catch {
    return false
  }
}
