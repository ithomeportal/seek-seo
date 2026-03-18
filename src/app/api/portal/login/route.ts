import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, verificationCode } = body as {
      email?: string
      verificationCode?: string
    }

    if (!email || !verificationCode) {
      return NextResponse.json(
        { success: false, message: 'Email and verification code are required' },
        { status: 400 }
      )
    }

    const result = await query(
      'SELECT id FROM clients WHERE email = $1 AND verification_code = $2',
      [email, verificationCode]
    )

    if (result.rows.length > 0) {
      return NextResponse.json({ success: true, clientId: result.rows[0].id })
    }

    return NextResponse.json(
      { success: false, message: 'Invalid credentials' },
      { status: 401 }
    )
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
