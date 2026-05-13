import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getClientIp, readPortalSession } from '@/lib/portal-auth'
import {
  getApplicationByEmail,
  maybeMarkCompleted,
  sendSignedDocumentEmail,
} from '@/lib/onboarding'
import { buildLeaseAgreementPdf } from '@/lib/onboarding-pdfs'

export async function POST(request: Request) {
  const session = await readPortalSession()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Not signed in' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    signedName?: unknown
    signatureConfirmed?: unknown
  }
  const signedName = typeof body.signedName === 'string' ? body.signedName.trim() : ''
  const signatureConfirmed = body.signatureConfirmed === true

  if (!signedName || signedName.length < 3) {
    return NextResponse.json(
      { success: false, message: 'Please type your full legal name to sign.' },
      { status: 400 }
    )
  }
  if (!signatureConfirmed) {
    return NextResponse.json(
      { success: false, message: 'You must confirm acceptance to continue.' },
      { status: 400 }
    )
  }

  const app = await getApplicationByEmail(session.email)
  if (!app) {
    return NextResponse.json(
      { success: false, message: 'Application not found.' },
      { status: 400 }
    )
  }
  if (app.status !== 'approved' && app.status !== 'bundle_started') {
    return NextResponse.json(
      {
        success: false,
        message: 'Your application has not been approved yet, or this step is no longer editable.',
      },
      { status: 400 }
    )
  }

  const ip = getClientIp(request.headers)
  const signedAt = new Date()

  await query(
    `UPDATE customer_onboarding_applications
        SET lease_signed_name = $1,
            lease_signed_at = NOW(),
            status = CASE WHEN status = 'approved' THEN 'bundle_started' ELSE status END,
            updated_at = NOW()
      WHERE id = $2`,
    [signedName, app.id]
  )

  const pdfBytes = await buildLeaseAgreementPdf({
    reference: app.reference,
    companyName: app.companyName,
    contactName: [app.contactFirstName, app.contactLastName].filter(Boolean).join(' '),
    email: session.email,
    phone: app.phone,
    signedName,
    signedAt,
    ip,
  })

  await sendSignedDocumentEmail({
    email: session.email,
    reference: app.reference,
    docName: 'Equipment Rental Agreement',
    signedName,
    pdfBytes,
    filename: `SEEK-Rental-Agreement-${app.reference}.pdf`,
  })

  await maybeMarkCompleted(session.email)

  return NextResponse.json({ success: true })
}
