import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code } = body as { code?: string }

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false }, { status: 400 })
    }

    const result = await query(
      'SELECT id FROM admin_access_codes WHERE code = $1 AND is_active = true',
      [code]
    )
    return NextResponse.json({ valid: result.rows.length > 0 })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
