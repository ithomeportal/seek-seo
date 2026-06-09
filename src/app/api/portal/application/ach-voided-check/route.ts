import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { readPortalSession } from '@/lib/portal-auth'
import { getApplicationByEmail, maybeMarkCompleted, publicView } from '@/lib/onboarding'

/**
 * Saves the Voided Check / Checking Account Deposit Slip uploaded under the ACH
 * section. The ACH section is only considered complete once both the
 * authorization is submitted and this file is uploaded.
 */
export async function POST(request: Request) {
  const session = await readPortalSession()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Not signed in' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as { url?: unknown }
  const url = typeof body.url === 'string' ? body.url.trim() : ''
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

  await query(
    `UPDATE customer_onboarding_applications
        SET ach_voided_check_url = $1,
            ach_voided_check_uploaded_at = NOW(),
            updated_at = NOW()
      WHERE id = $2`,
    [url, app.id]
  )

  const updated = await maybeMarkCompleted(session.email)
  if (!updated) {
    return NextResponse.json({ success: false, message: 'Application not found.' }, { status: 500 })
  }
  return NextResponse.json({ success: true, application: publicView(updated) })
}
