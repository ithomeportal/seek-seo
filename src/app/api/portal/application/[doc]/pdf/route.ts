import { NextResponse } from 'next/server'
import { readPortalSession } from '@/lib/portal-auth'
import { getApplicationByEmail } from '@/lib/onboarding'
import {
  buildAchAuthorizationPdf,
  buildLeaseAgreementPdf,
  buildPersonalGuarantyPdf,
} from '@/lib/onboarding-pdfs'

type DocKind = 'ach' | 'lease' | 'guaranty'

export async function GET(
  _request: Request,
  context: { params: Promise<{ doc: string }> }
) {
  const { doc } = await context.params
  if (doc !== 'ach' && doc !== 'lease' && doc !== 'guaranty') {
    return NextResponse.json({ success: false, message: 'Unknown document' }, { status: 404 })
  }

  const session = await readPortalSession()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Not signed in' }, { status: 401 })
  }

  const app = await getApplicationByEmail(session.email)
  if (!app) {
    return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 })
  }

  const kind = doc as DocKind
  const contactName = [app.contactFirstName, app.contactLastName].filter(Boolean).join(' ')

  let bytes: Uint8Array
  let filename: string

  if (kind === 'ach') {
    if (!app.achAuthorizedAt) {
      return NextResponse.json(
        { success: false, message: 'ACH Authorization not signed yet' },
        { status: 400 }
      )
    }
    bytes = await buildAchAuthorizationPdf({
      reference: app.reference,
      companyName: app.companyName,
      contactName,
      email: app.email,
      phone: app.phone,
      bankName: app.achBankName ?? '',
      routingLast4: app.achRoutingLast4 ?? '',
      accountLast4: app.achAccountLast4 ?? '',
      accountType: app.achAccountType === 'savings' ? 'savings' : 'checking',
      authorizedName: app.achAuthorizedName ?? contactName,
      authorizedAt: new Date(app.achAuthorizedAt),
      ip: null,
    })
    filename = `SEEK-ACH-Authorization-${app.reference}.pdf`
  } else if (kind === 'lease') {
    if (!app.leaseSignedAt) {
      return NextResponse.json(
        { success: false, message: 'Lease not signed yet' },
        { status: 400 }
      )
    }
    bytes = await buildLeaseAgreementPdf({
      reference: app.reference,
      companyName: app.companyName,
      contactName,
      email: app.email,
      phone: app.phone,
      signedName: app.leaseSignedName ?? contactName,
      signedAt: new Date(app.leaseSignedAt),
      ip: null,
    })
    filename = `SEEK-Rental-Agreement-${app.reference}.pdf`
  } else {
    if (!app.guarantySignedAt) {
      return NextResponse.json(
        { success: false, message: 'Guaranty not signed yet' },
        { status: 400 }
      )
    }
    bytes = await buildPersonalGuarantyPdf({
      reference: app.reference,
      companyName: app.companyName,
      guarantorName: app.guarantySignedName ?? contactName,
      email: app.email,
      phone: app.phone,
      signedAt: new Date(app.guarantySignedAt),
      ip: null,
    })
    filename = `SEEK-Personal-Guaranty-${app.reference}.pdf`
  }

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
