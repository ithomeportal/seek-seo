import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { query } from '@/lib/db'

const ALLOWED_DOMAINS = ['seekequipment.com', 'unilinktransportation.com']

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body as { email?: string }

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    const emailLower = email.toLowerCase().trim()
    const domain = emailLower.split('@')[1]

    if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized email domain' },
        { status: 403 }
      )
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Deactivate any previous codes for this email
    await query(
      'UPDATE admin_access_codes SET is_active = false WHERE email = $1',
      [emailLower]
    )

    // Store new code
    await query(
      'INSERT INTO admin_access_codes (code, email, is_active, expires_at, created_at) VALUES ($1, $2, true, $3, NOW())',
      [code, emailLower, expiresAt.toISOString()]
    )

    // Send via Resend
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      console.error('RESEND_API_KEY not configured')
      return NextResponse.json(
        { success: false, message: 'Email service not configured' },
        { status: 500 }
      )
    }

    const resend = new Resend(resendKey)
    await resend.emails.send({
      from: 'SEEK Equipment <noreply@unilinkportal.com>',
      to: emailLower,
      subject: 'SEEK Equipment — Your Access Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #35668d; margin-bottom: 24px;">SEEK Equipment Portal</h2>
          <p style="color: #374151; font-size: 16px;">Your one-time access code is:</p>
          <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ee5519;">${code}</span>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This code expires in 10 minutes.</p>
          <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">SEEK Equipment Rentals &bull; 1-210-802-0000</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, message: 'Code sent to your email' })
  } catch (error) {
    console.error('Send code error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { success: false, message: 'Failed to send code' },
      { status: 500 }
    )
  }
}
