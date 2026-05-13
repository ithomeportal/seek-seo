import { createHash, randomBytes, randomInt, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { query } from '@/lib/db'

export const PORTAL_SESSION_COOKIE = 'seek_portal_session'
export const PORTAL_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
export const PORTAL_CODE_TTL_MS = 10 * 60 * 1000 // 10 minutes
export const PORTAL_CODE_MAX_ATTEMPTS = 5
export const PORTAL_CODE_RATE_LIMIT = 5 // requests per hour per email
export const PORTAL_CODE_RATE_WINDOW_MS = 60 * 60 * 1000

export function normalizeEmail(raw: string): string {
  return raw.toLowerCase().trim()
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 255
}

export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

export function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

export function constantTimeEquals(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export interface PortalSession {
  email: string
  customerId: number | null
}

export async function createPortalSession(
  email: string,
  customerId: number | null,
  userAgent: string | null,
  ipAddress: string | null
): Promise<string> {
  const token = generateSessionToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + PORTAL_SESSION_TTL_MS)

  await query(
    `INSERT INTO portal_sessions
       (token_hash, email, customer_id, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [tokenHash, email, customerId, expiresAt.toISOString(), userAgent, ipAddress]
  )

  return token
}

export async function readPortalSession(): Promise<PortalSession | null> {
  const store = await cookies()
  const cookie = store.get(PORTAL_SESSION_COOKIE)
  if (!cookie?.value) return null

  const tokenHash = hashToken(cookie.value)
  const result = await query<{
    email: string
    customer_id: number | null
  }>(
    `SELECT email, customer_id
       FROM portal_sessions
      WHERE token_hash = $1 AND expires_at > NOW()`,
    [tokenHash]
  )

  if (result.rows.length === 0) return null

  await query(
    `UPDATE portal_sessions SET last_seen_at = NOW() WHERE token_hash = $1`,
    [tokenHash]
  )

  return {
    email: result.rows[0].email,
    customerId: result.rows[0].customer_id,
  }
}

export async function deletePortalSession(): Promise<void> {
  const store = await cookies()
  const cookie = store.get(PORTAL_SESSION_COOKIE)
  if (!cookie?.value) return

  const tokenHash = hashToken(cookie.value)
  await query(`DELETE FROM portal_sessions WHERE token_hash = $1`, [tokenHash])
}

export function getClientIp(headers: Headers): string | null {
  const fwd = headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]?.trim() ?? null
  return headers.get('x-real-ip')
}

export async function countRecentCodes(email: string): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
       FROM customer_access_codes
      WHERE LOWER(email) = $1
        AND created_at > NOW() - INTERVAL '1 hour'`,
    [email]
  )
  return Number(result.rows[0]?.count ?? 0)
}

export async function findCustomerByEmail(email: string): Promise<number | null> {
  const result = await query<{ id: number }>(
    `SELECT id FROM customers WHERE LOWER(email) = $1 LIMIT 1`,
    [email]
  )
  return result.rows[0]?.id ?? null
}
