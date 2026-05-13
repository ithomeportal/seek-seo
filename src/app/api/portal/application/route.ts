import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { readPortalSession } from '@/lib/portal-auth'
import {
  bundleProgress,
  createApplication,
  getApplicationByEmail,
  OnboardingApplication,
} from '@/lib/onboarding'

function publicView(app: OnboardingApplication) {
  const progress = bundleProgress(app)
  return {
    id: app.id,
    reference: app.reference,
    status: app.status,
    companyName: app.companyName,
    contactFirstName: app.contactFirstName,
    contactLastName: app.contactLastName,
    phone: app.phone,
    dlUploadedAt: app.dlUploadedAt,
    dlFilename: app.dlFilename,
    reviewedAt: app.reviewedAt,
    declineReason: app.declineReason,
    achBankName: app.achBankName,
    achAccountLast4: app.achAccountLast4,
    achAuthorizedAt: app.achAuthorizedAt,
    leaseSignedAt: app.leaseSignedAt,
    leaseSignedName: app.leaseSignedName,
    guarantySignedAt: app.guarantySignedAt,
    guarantySignedName: app.guarantySignedName,
    completedAt: app.completedAt,
    createdAt: app.createdAt,
    progress,
  }
}

export async function GET() {
  const session = await readPortalSession()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Not signed in' }, { status: 401 })
  }
  const existing = await getApplicationByEmail(session.email)
  if (existing) {
    return NextResponse.json({ success: true, application: publicView(existing) })
  }
  return NextResponse.json({ success: true, application: null })
}

export async function POST(request: Request) {
  const session = await readPortalSession()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Not signed in' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    companyName?: unknown
    contactFirstName?: unknown
    contactLastName?: unknown
    phone?: unknown
  }
  const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : ''
  const firstName = typeof body.contactFirstName === 'string' ? body.contactFirstName.trim() : ''
  const lastName = typeof body.contactLastName === 'string' ? body.contactLastName.trim() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''

  if (!companyName || !firstName || !lastName) {
    return NextResponse.json(
      { success: false, message: 'Company name, first name, and last name are required.' },
      { status: 400 }
    )
  }

  let app = await getApplicationByEmail(session.email)
  if (!app) {
    app = await createApplication(session.email)
  }

  if (app.status === 'declined') {
    return NextResponse.json(
      {
        success: false,
        message:
          'Your previous application was declined. Please contact SEEK Equipment to discuss re-applying.',
      },
      { status: 400 }
    )
  }

  await query(
    `UPDATE customer_onboarding_applications
        SET company_name = $1,
            contact_first_name = $2,
            contact_last_name = $3,
            phone = $4,
            updated_at = NOW()
      WHERE id = $5`,
    [companyName, firstName, lastName, phone || null, app.id]
  )

  const updated = await getApplicationByEmail(session.email)
  if (!updated) {
    return NextResponse.json(
      { success: false, message: 'Application not found.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, application: publicView(updated) })
}
