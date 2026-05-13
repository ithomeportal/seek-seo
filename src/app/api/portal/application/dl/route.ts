import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { query } from '@/lib/db'
import { readPortalSession } from '@/lib/portal-auth'
import { getApplicationByEmail } from '@/lib/onboarding'

export async function POST(request: Request) {
  const session = await readPortalSession()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Not signed in' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    url?: unknown
    filename?: unknown
  }
  const url = typeof body.url === 'string' ? body.url.trim() : ''
  const filename = typeof body.filename === 'string' ? body.filename.trim() : ''

  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json(
      { success: false, message: 'A valid uploaded file URL is required.' },
      { status: 400 }
    )
  }

  const app = await getApplicationByEmail(session.email)
  if (!app) {
    return NextResponse.json(
      { success: false, message: 'Application not found. Please save your contact info first.' },
      { status: 400 }
    )
  }
  if (!app.companyName || !app.contactFirstName) {
    return NextResponse.json(
      { success: false, message: 'Please complete your contact info before uploading your DL.' },
      { status: 400 }
    )
  }
  if (app.status !== 'created' && app.status !== 'dl_submitted') {
    return NextResponse.json(
      { success: false, message: 'Driver license cannot be changed at this stage.' },
      { status: 400 }
    )
  }

  await query(
    `UPDATE customer_onboarding_applications
        SET dl_url = $1,
            dl_filename = $2,
            dl_uploaded_at = NOW(),
            status = 'dl_submitted',
            updated_at = NOW()
      WHERE id = $3`,
    [url, filename || null, app.id]
  )

  await notifySeekOfNewApplication(app.reference, session.email, app.companyName)

  return NextResponse.json({ success: true })
}

async function notifySeekOfNewApplication(
  reference: string,
  email: string,
  companyName: string | null
): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return
  const resend = new Resend(resendKey)
  try {
    await resend.emails.send({
      from: 'SEEK Equipment <noreply@unilinkportal.com>',
      to: 'rodney@seekequipment.com',
      cc: 'emendoza@seekequipment.com',
      subject: `New customer onboarding application — ${companyName ?? email} (${reference})`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px;">
          <h2 style="color: #35668d;">New Onboarding Application</h2>
          <p>A new customer has submitted Phase 1 of the onboarding flow and is awaiting review.</p>
          <ul>
            <li><strong>Reference:</strong> ${reference}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Company:</strong> ${companyName ?? '—'}</li>
          </ul>
          <p>Review the application in the SEEK admin portal under the Onboarding tab.</p>
        </div>
      `,
    })
  } catch {
    // Best effort
  }
}
