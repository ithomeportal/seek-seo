import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getClientIp, readPortalSession } from '@/lib/portal-auth'
import {
  getApplicationByEmail,
  maybeMarkCompleted,
  sendSignedDocumentEmail,
} from '@/lib/onboarding'
import { buildAchAuthorizationPdf } from '@/lib/onboarding-pdfs'

function last4(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits.slice(-4).padStart(4, '0')
}

export async function POST(request: Request) {
  const session = await readPortalSession()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Not signed in' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    bankName?: unknown
    routingNumber?: unknown
    accountNumber?: unknown
    accountType?: unknown
    voidedCheckUrl?: unknown
    authorizedName?: unknown
    signatureConfirmed?: unknown
  }

  const bankName = typeof body.bankName === 'string' ? body.bankName.trim() : ''
  const routingNumberRaw = typeof body.routingNumber === 'string' ? body.routingNumber : ''
  const accountNumberRaw = typeof body.accountNumber === 'string' ? body.accountNumber : ''
  const accountType = body.accountType === 'savings' ? 'savings' : 'checking'
  const voidedCheckUrl = typeof body.voidedCheckUrl === 'string' ? body.voidedCheckUrl.trim() : ''
  const authorizedName = typeof body.authorizedName === 'string' ? body.authorizedName.trim() : ''
  const signatureConfirmed = body.signatureConfirmed === true

  const routingDigits = routingNumberRaw.replace(/\D/g, '')
  const accountDigits = accountNumberRaw.replace(/\D/g, '')

  if (!bankName) {
    return NextResponse.json(
      { success: false, message: 'Bank name is required.' },
      { status: 400 }
    )
  }
  if (routingDigits.length !== 9) {
    return NextResponse.json(
      { success: false, message: 'Routing number must be exactly 9 digits.' },
      { status: 400 }
    )
  }
  if (accountDigits.length < 4 || accountDigits.length > 17) {
    return NextResponse.json(
      { success: false, message: 'Account number must be 4–17 digits.' },
      { status: 400 }
    )
  }
  if (!authorizedName || authorizedName.length < 3) {
    return NextResponse.json(
      { success: false, message: 'Please type your full legal name to sign.' },
      { status: 400 }
    )
  }
  if (!signatureConfirmed) {
    return NextResponse.json(
      { success: false, message: 'You must confirm the authorization to continue.' },
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
  const routingLast4 = last4(routingDigits)
  const accountLast4 = last4(accountDigits)
  const signedAt = new Date()

  await query(
    `UPDATE customer_onboarding_applications
        SET ach_bank_name = $1,
            ach_routing_last4 = $2,
            ach_account_last4 = $3,
            ach_account_type = $4,
            ach_voided_check_url = $5,
            ach_authorized_name = $6,
            ach_authorized_at = NOW(),
            status = CASE WHEN status = 'approved' THEN 'bundle_started' ELSE status END,
            updated_at = NOW()
      WHERE id = $7`,
    [
      bankName,
      routingLast4,
      accountLast4,
      accountType,
      voidedCheckUrl || null,
      authorizedName,
      app.id,
    ]
  )

  const pdfBytes = await buildAchAuthorizationPdf({
    reference: app.reference,
    companyName: app.companyName,
    contactName: [app.contactFirstName, app.contactLastName].filter(Boolean).join(' '),
    email: session.email,
    phone: app.phone,
    bankName,
    routingLast4,
    accountLast4,
    accountType,
    authorizedName,
    authorizedAt: signedAt,
    ip,
  })

  await sendSignedDocumentEmail({
    email: session.email,
    reference: app.reference,
    docName: 'ACH Authorization',
    signedName: authorizedName,
    pdfBytes,
    filename: `SEEK-ACH-Authorization-${app.reference}.pdf`,
  })

  await maybeMarkCompleted(session.email)

  return NextResponse.json({ success: true })
}
