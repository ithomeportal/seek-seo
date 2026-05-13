import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { query } from '@/lib/db'
import { getApplicationById } from '@/lib/onboarding'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const numericId = Number(id)
  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 })
  }

  const body = (await request.json().catch(() => ({}))) as { reviewedBy?: unknown }
  const reviewedBy =
    typeof body.reviewedBy === 'string' && body.reviewedBy.trim()
      ? body.reviewedBy.trim()
      : 'admin'

  const app = await getApplicationById(numericId)
  if (!app) {
    return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 })
  }
  if (app.status !== 'dl_submitted') {
    return NextResponse.json(
      {
        success: false,
        message: `Application is in status "${app.status}" — only dl_submitted apps can be approved.`,
      },
      { status: 400 }
    )
  }

  await query(
    `UPDATE customer_onboarding_applications
        SET status = 'approved',
            reviewed_by = $1,
            reviewed_at = NOW(),
            decline_reason = NULL,
            updated_at = NOW()
      WHERE id = $2`,
    [reviewedBy, numericId]
  )

  await sendApprovalEmail(app.email, app.companyName, app.reference)
  return NextResponse.json({ success: true })
}

async function sendApprovalEmail(
  email: string,
  companyName: string | null,
  reference: string
): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return
  const resend = new Resend(resendKey)
  try {
    await resend.emails.send({
      from: 'SEEK Equipment <noreply@unilinkportal.com>',
      to: email,
      cc: 'rodney@seekequipment.com',
      subject: `You're approved — complete your SEEK Equipment onboarding (${reference})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #35668d;">You're approved!</h2>
          <p>Hi ${companyName ?? 'there'},</p>
          <p>
            Your application has been approved by SEEK Equipment. The next step is to
            complete the document bundle in your customer portal: ACH Authorization,
            Equipment Rental Agreement, and Personal Guaranty.
          </p>
          <p style="margin: 24px 0;">
            <a href="https://www.seekequipment.com/client-portal"
               style="background:#ee5519;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
              Continue onboarding
            </a>
          </p>
          <p><strong>Reference:</strong> ${reference}</p>
          <hr style="border:none; border-top:1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color:#9ca3af; font-size:12px;">SEEK Equipment Rentals &bull; info@seekequipment.com &bull; (210) 802-0000</p>
        </div>
      `,
    })
  } catch {
    // Best effort
  }
}
