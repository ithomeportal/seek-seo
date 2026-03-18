import { NextResponse } from 'next/server'
import { verifyAdminCode } from '@/data/demo-data'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code } = body as { code?: string }

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false }, { status: 400 })
    }

    const valid = verifyAdminCode(code)
    return NextResponse.json({ valid })
  } catch {
    return NextResponse.json({ valid: false }, { status: 400 })
  }
}
