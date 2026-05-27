import { NextResponse } from 'next/server'
import { generateChallenge } from '@/lib/captcha'

export const dynamic = 'force-dynamic'

/** Returns a fresh math challenge `{ a, b, token }` for public forms. */
export function GET() {
  const { a, b, token } = generateChallenge()
  return NextResponse.json(
    { a, b, token },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
