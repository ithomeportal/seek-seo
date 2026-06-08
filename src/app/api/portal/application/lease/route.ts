import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { readPortalSession } from '@/lib/portal-auth'
import { leaseAgreementSchema } from '@/lib/validators'
import { buildLeaseAgreementPdf } from '@/lib/lease-agreement-pdf'
import {
  getApplicationByEmail,
  maybeMarkCompleted,
  publicView,
  sendOnboardingDocument,
} from '@/lib/onboarding'

function clientIp(request: Request): string | null {
  const fwd = request.headers.get('x-forwarded-for')
  return fwd ? fwd.split(',')[0].trim() : null
}

/**
 * Native Equipment Rental Agreement + Personal Guaranty submission. Records the
 * lessee + guarantor signatures, generates the signed PDF, emails SEEK + the
 * customer, and advances onboarding completion. Guarantor PII lives only in the
 * emailed PDF — the DB stores names + timestamps.
 */
export async function POST(request: Request) {
  const session = await readPortalSession()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Not signed in' }, { status: 401 })
  }

  const parsed = leaseAgreementSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: 'Please review the highlighted fields and try again.',
        issues: parsed.error.flatten(),
      },
      { status: 400 }
    )
  }
  const data = parsed.data
  if (data.honeypot) {
    return NextResponse.json({ success: true })
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
      { success: false, message: 'Please complete your contact info first.' },
      { status: 400 }
    )
  }

  await query(
    `UPDATE customer_onboarding_applications
        SET lease_signed_name = $1,
            lease_signed_at = NOW(),
            guaranty_signed_name = $2,
            guaranty_signed_at = NOW(),
            updated_at = NOW()
      WHERE id = $3`,
    [data.signatureName, data.guarantySignatureName, app.id]
  )

  const submittedAt = new Date()
  try {
    const pdfBytes = await buildLeaseAgreementPdf({
      ...data,
      reference: app.reference,
      companyName: app.companyName,
      applicantEmail: session.email,
      submittedAt,
      submitterIp: clientIp(request),
    })
    await sendOnboardingDocument({
      documentType: 'lease',
      documentLabel: 'Lease Agreement & Guaranty to Pay',
      reference: app.reference,
      email: session.email,
      companyName: app.companyName,
      pdfBytes,
      submittedAt,
    })
  } catch {
    // Delivery is best-effort; the signatures are already recorded.
  }

  const updated = await maybeMarkCompleted(session.email)
  if (!updated) {
    return NextResponse.json({ success: false, message: 'Application not found.' }, { status: 500 })
  }
  return NextResponse.json({ success: true, application: publicView(updated) })
}
