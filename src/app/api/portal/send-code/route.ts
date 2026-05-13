import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { query } from '@/lib/db'
import {
  PORTAL_CODE_RATE_LIMIT,
  PORTAL_CODE_TTL_MS,
  countRecentCodes,
  generateCode,
  getClientIp,
  hashCode,
  isValidEmail,
  normalizeEmail,
} from '@/lib/portal-auth'

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { email?: unknown }
    const rawEmail = typeof body.email === 'string' ? body.email : ''

    if (!rawEmail || !isValidEmail(rawEmail)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address.' },
        { status: 400 }
      )
    }

    const email = normalizeEmail(rawEmail)
    const ip = getClientIp(request.headers)

    const recentCount = await countRecentCodes(email)
    if (recentCount >= PORTAL_CODE_RATE_LIMIT) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Too many codes requested. Please wait an hour before trying again.',
        },
        { status: 429 }
      )
    }

    const code = generateCode()
    const codeHash = hashCode(code)
    const expiresAt = new Date(Date.now() + PORTAL_CODE_TTL_MS)

    await query(
      `UPDATE customer_access_codes
          SET is_active = false
        WHERE LOWER(email) = $1 AND is_active = true`,
      [email]
    )

    await query(
      `INSERT INTO customer_access_codes
         (email, code_hash, expires_at, request_ip)
       VALUES ($1, $2, $3, $4)`,
      [email, codeHash, expiresAt.toISOString(), ip]
    )

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      return NextResponse.json(
        { success: false, message: 'Email service is not configured.' },
        { status: 500 }
      )
    }

    const resend = new Resend(resendKey)
    await resend.emails.send({
      from: 'SEEK Equipment <noreply@unilinkportal.com>',
      to: email,
      subject: 'SEEK Equipment — Your Login Code',
      html: buildCodeEmailHtml(code),
    })

    return NextResponse.json({
      success: true,
      message: 'A 6-digit code has been emailed to you. It expires in 10 minutes.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, message: `Unable to send code: ${message}` },
      { status: 500 }
    )
  }
}

function buildCodeEmailHtml(code: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #35668d; margin-bottom: 8px;">SEEK Equipment Customer Portal</h2>
      <p style="color: #374151; font-size: 15px; margin-top: 16px;">
        Your one-time login code is:
      </p>
      <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0;">
        <span style="font-size: 38px; font-weight: bold; letter-spacing: 10px; color: #ee5519;">${code}</span>
      </div>
      <p style="color: #6b7280; font-size: 14px;">
        This code expires in 10 minutes and can be used once. Never share it with anyone.
      </p>
      <p style="color: #6b7280; font-size: 14px;">
        If you didn't request this code, you can safely ignore this email — no action is needed.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">
        SEEK Equipment Rentals &bull; info@seekequipment.com &bull; 1-210-802-0000
      </p>
    </div>
  `
}
