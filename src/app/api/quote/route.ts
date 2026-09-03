import { NextResponse } from 'next/server'
import { quoteSchema } from '@/lib/validators'
import { verifyChallenge } from '@/lib/captcha'
import { query } from '@/lib/db'
import { notifySeekOfInquiry } from '@/lib/inquiry-notification'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = quoteSchema.parse(body)

    // Check honeypot
    if (data.honeypot) {
      return NextResponse.json({ success: true }) // silently ignore spam
    }

    // Human-verification math challenge (server-validated; bots posting blind fail here)
    if (!verifyChallenge(data.captchaToken, data.captchaAnswer)) {
      return NextResponse.json(
        { success: false, message: 'Verification failed. Please re-check the sum and try again.' },
        { status: 400 }
      )
    }

    // Save to database FIRST — this row is the durable record, and the
    // notification below is best-effort on top of it.
    const saved = await query<{ id: number; created_at: Date }>(
      `INSERT INTO contact_submissions (name, email, phone, company, message, type, trailer_type, quantity, duration, start_date)
       VALUES ($1, $2, $3, $4, $5, 'quote', $6, $7, $8, $9)
       RETURNING id, created_at`,
      [
        data.name,
        data.email,
        data.phone,
        data.company,
        data.details ?? null,
        data.trailerType,
        data.quantity,
        data.duration,
        data.startDate ?? null,
      ]
    )
    const row = saved.rows[0]

    // Notify SEEK. Isolated and non-fatal on purpose: the submission is already
    // committed, so a dead Resend key must not turn a successful quote request
    // into "something went wrong" for the customer. A failure is logged loudly
    // and the row still shows in the admin Inquiries tab.
    const notified = await notifySeekOfInquiry({
      id: row.id,
      kind: 'quote',
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      message: data.details ?? null,
      submittedAt: row.created_at,
      trailerType: data.trailerType,
      quantity: data.quantity,
      duration: data.duration,
      startDate: data.startDate ?? null,
    })
    if (!notified.ok) {
      console.error(
        `[quote] inquiry #${row.id} saved but NOT emailed` +
          `${notified.skipped ? ' (skipped)' : ''}: ${notified.error}`
      )
    }

    return NextResponse.json({
      success: true,
      message:
        'Thank you! We will prepare your quote and get back to you within 2 business hours.',
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, message: 'Please check your form inputs.' },
        { status: 400 }
      )
    }
    // ⚠ Log before answering. This catch swallowed every error in silence
    // until 2026-09-03, which is how the quote route could throw `42703
    // column "trailer_type" does not exist` on EVERY submission for five
    // months — the customer saw "please try again", the request was lost, and
    // nothing anywhere recorded that it had happened.
    const code = (error as { code?: string }).code
    console.error(
      `[quote] submission FAILED${code ? ` (SQLSTATE ${code})` : ''}:`,
      error instanceof Error ? error.message : error
    )
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
