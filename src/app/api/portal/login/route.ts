import { NextResponse } from 'next/server'
import { verifyClientLogin } from '@/data/demo-data'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, verificationCode } = body as {
      email?: string
      verificationCode?: string
    }

    if (!email || !verificationCode) {
      return NextResponse.json(
        { success: false, error: 'Email and verification code are required' },
        { status: 400 }
      )
    }

    const result = verifyClientLogin(email, verificationCode)

    if (result.success) {
      return NextResponse.json({ success: true, clientId: result.clientId })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid email or verification code' },
      { status: 401 }
    )
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
