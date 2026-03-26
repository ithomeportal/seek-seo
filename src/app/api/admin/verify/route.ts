import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, code } = body as { email?: string; code?: string }

    if (!email || !code || typeof email !== 'string' || typeof code !== 'string') {
      return NextResponse.json({ valid: false }, { status: 400 })
    }

    const emailLower = email.toLowerCase().trim()

    const result = await query(
      `SELECT id FROM admin_access_codes
       WHERE email = $1 AND code = $2 AND is_active = true AND expires_at > NOW()`,
      [emailLower, code]
    )

    if (result.rows.length > 0) {
      // Deactivate used code
      await query(
        'UPDATE admin_access_codes SET is_active = false WHERE email = $1 AND code = $2',
        [emailLower, code]
      )
      return NextResponse.json({ valid: true })
    }

    return NextResponse.json({ valid: false })
  } catch (error) {
    console.error('Admin verify error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
