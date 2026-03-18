import { NextResponse } from 'next/server'
import { contactSchema } from '@/lib/validators'
import { query } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = contactSchema.parse(body)

    // Check honeypot
    if (data.honeypot) {
      return NextResponse.json({ success: true }) // silently ignore spam
    }

    // Save to database
    await query(
      `INSERT INTO contact_submissions (name, email, phone, company, message, type)
       VALUES ($1, $2, $3, $4, $5, 'contact')`,
      [data.name, data.email, data.phone ?? null, data.company ?? null, data.message]
    )

    // TODO: Integrate with email service (Resend)

    return NextResponse.json({
      success: true,
      message: 'Thank you! We will get back to you within 2 business hours.',
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, message: 'Please check your form inputs.' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
