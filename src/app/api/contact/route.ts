import { NextResponse } from 'next/server'
import { contactSchema } from '@/lib/validators'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = contactSchema.parse(body)

    // Check honeypot
    if (data.honeypot) {
      return NextResponse.json({ success: true }) // silently ignore spam
    }

    // TODO: Integrate with email service (Resend)
    // For now, log and return success
    // eslint-disable-next-line no-console
    console.log('Contact form submission:', data)

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
