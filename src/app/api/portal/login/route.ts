import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import {
  PORTAL_CODE_MAX_ATTEMPTS,
  PORTAL_SESSION_COOKIE,
  PORTAL_SESSION_TTL_MS,
  createPortalSession,
  findCustomerByEmail,
  getClientIp,
  hashCode,
  isValidEmail,
  normalizeEmail,
} from '@/lib/portal-auth'

interface CodeRow {
  id: number
  attempts: number
  expires_at: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: unknown
      code?: unknown
    }
    const rawEmail = typeof body.email === 'string' ? body.email : ''
    const rawCode = typeof body.code === 'string' ? body.code : ''

    if (!isValidEmail(rawEmail) || !/^\d{6}$/.test(rawCode)) {
      return NextResponse.json(
        { success: false, message: 'Enter your email and the 6-digit code.' },
        { status: 400 }
      )
    }

    const email = normalizeEmail(rawEmail)
    const codeHash = hashCode(rawCode)

    const codeResult = await query<CodeRow>(
      `SELECT id, attempts, expires_at::text
         FROM customer_access_codes
        WHERE LOWER(email) = $1
          AND is_active = true
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1`,
      [email]
    )

    if (codeResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No active code for this email. Request a new code.' },
        { status: 401 }
      )
    }

    const row = codeResult.rows[0]

    if (row.attempts >= PORTAL_CODE_MAX_ATTEMPTS) {
      await query(
        `UPDATE customer_access_codes SET is_active = false WHERE id = $1`,
        [row.id]
      )
      return NextResponse.json(
        { success: false, message: 'Too many attempts. Request a new code.' },
        { status: 401 }
      )
    }

    const match = await query<{ id: number }>(
      `SELECT id FROM customer_access_codes
        WHERE id = $1 AND code_hash = $2`,
      [row.id, codeHash]
    )

    if (match.rows.length === 0) {
      await query(
        `UPDATE customer_access_codes
            SET attempts = attempts + 1
          WHERE id = $1`,
        [row.id]
      )
      const remaining = Math.max(0, PORTAL_CODE_MAX_ATTEMPTS - (row.attempts + 1))
      return NextResponse.json(
        {
          success: false,
          message:
            remaining > 0
              ? `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
              : 'Invalid code. Request a new code.',
        },
        { status: 401 }
      )
    }

    await query(
      `UPDATE customer_access_codes
          SET is_active = false, consumed_at = NOW()
        WHERE id = $1`,
      [row.id]
    )

    const customerId = await findCustomerByEmail(email)
    const ip = getClientIp(request.headers)
    const userAgent = request.headers.get('user-agent')

    const token = await createPortalSession(email, customerId, userAgent, ip)

    const response = NextResponse.json({
      success: true,
      customerId,
      hasExistingAccount: customerId !== null,
    })

    response.cookies.set(PORTAL_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(PORTAL_SESSION_TTL_MS / 1000),
    })

    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, message: `Login failed: ${message}` },
      { status: 500 }
    )
  }
}
