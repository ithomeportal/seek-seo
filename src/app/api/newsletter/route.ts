import { NextResponse } from 'next/server'
import { newsletterSchema } from '@/lib/validators'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = newsletterSchema.parse(body)

    // TODO: Integrate with email marketing service (Resend, Mailchimp, etc.)
    // For now, log and return success
    // eslint-disable-next-line no-console
    console.log('Newsletter subscription:', data)

    return NextResponse.json({
      success: true,
      message:
        'Thank you for subscribing! You will receive our latest updates and industry insights.',
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address.' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
