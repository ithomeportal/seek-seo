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

  const body = (await request.json().catch(() => ({}))) as {
    reviewedBy?: unknown
    reason?: unknown
  }
  const reviewedBy =
    typeof body.reviewedBy === 'string' && body.reviewedBy.trim()
      ? body.reviewedBy.trim()
      : 'admin'
  const reason = typeof body.reason === 'string' ? body.reason.trim() : ''

  const app = await getApplicationById(numericId)
  if (!app) {
    return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 })
  }
  if (app.status !== 'dl_submitted') {
    return NextResponse.json(
      {
        success: false,
        message: `Application is in status "${app.status}" — only dl_submitted apps can be declined.`,
      },
      { status: 400 }
    )
  }

  await query(
    `UPDATE customer_onboarding_applications
        SET status = 'declined',
            reviewed_by = $1,
            reviewed_at = NOW(),
            decline_reason = $2,
            updated_at = NOW()
      WHERE id = $3`,
    [reviewedBy, reason || null, numericId]
  )

  await sendDeclineEmail(app.email, app.companyName, app.reference, reason)
  return NextResponse.json({ success: true })
}

async function sendDeclineEmail(
  email: string,
  companyName: string | null,
  reference: string,
  reason: string
): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return
  const resend = new Resend(resendKey)
  try {
    await resend.emails.send({
      from: 'SEEK Equipment <noreply@unilinkportal.com>',
      to: email,
      cc: 'rodney@seekequipment.com',
      subject: `Update on your SEEK Equipment application (${reference})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #35668d;">Application update</h2>
          <p>Hi ${companyName ?? 'there'},</p>
          <p>
            Thank you for applying with SEEK Equipment. After reviewing your application,
            we are unable to approve it at this time.
          </p>
          ${
            reason
              ? `<p><strong>Reviewer note:</strong> ${reason.replace(/[<>&"]/g, '')}</p>`
              : ''
          }
          <p>
            You're welcome to contact us at <a href="mailto:info@seekequipment.com">info@seekequipment.com</a>
            or (210) 802-0000 to discuss next steps or to revise and resubmit.
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
