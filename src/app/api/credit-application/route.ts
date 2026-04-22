import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { creditApplicationSchema } from '@/lib/validators'
import { query } from '@/lib/db'
import { buildCreditApplicationPdf, entityLabel } from '@/lib/credit-application-pdf'

const RECIPIENT_PRIMARY = 'rodney@seekequipment.com'
const RECIPIENT_CC = 'emendoza@seekequipment.com'
const FROM_ADDRESS = 'SEEK Equipment <noreply@unilinkportal.com>'

function last4(value: string | undefined | null): string | null {
  if (!value) return null
  const clean = value.replace(/\s+/g, '')
  if (clean.length <= 4) return clean
  return clean.slice(-4)
}

async function generateReference(): Promise<string> {
  const year = new Date().getUTCFullYear()
  const result = await query(
    `SELECT COUNT(*)::int AS count FROM credit_applications WHERE reference_number LIKE $1`,
    [`CA-${year}-%`]
  )
  const next = (result.rows[0]?.count ?? 0) + 1
  return `CA-${year}-${String(next).padStart(4, '0')}`
}

function summaryHtml(
  data: ReturnType<typeof creditApplicationSchema.parse>,
  reference: string
) {
  const row = (label: string, value: string | undefined | null) =>
    `<tr><td style="padding:6px 10px;color:#6b7280;font-size:12px;">${label}</td><td style="padding:6px 10px;color:#111827;font-size:13px;font-weight:500;">${(value ?? '—') || '—'}</td></tr>`

  const refs = (data.tradeReferences ?? [])
    .filter((r) => r.name || r.phone || r.address)
    .map(
      (r, i) =>
        `<tr><td style="padding:6px 10px;color:#6b7280;font-size:12px;">Reference ${i + 1}</td><td style="padding:6px 10px;color:#111827;font-size:13px;">${r.name ?? '—'} · ${r.phone ?? '—'} · ${r.address ?? '—'}</td></tr>`
    )
    .join('')

  return `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; color:#111827;">
      <h2 style="color: #35668d; margin-bottom: 8px;">New Credit Application</h2>
      <p style="color: #6b7280; margin:0 0 16px 0;">Reference <strong style="color:#ee5519;">${reference}</strong></p>
      <p style="color:#374151;">A customer has submitted a credit application. The completed PDF is attached.</p>

      <h3 style="color:#35668d;margin-top:24px;font-size:14px;">Customer</h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;">
        ${row('Name', data.customerName)}
        ${row('Phone', data.customerPhone)}
        ${row('Address', [data.customerStreet, data.customerCity, data.customerState, data.customerZip].filter(Boolean).join(', '))}
      </table>

      <h3 style="color:#35668d;margin-top:20px;font-size:14px;">Business</h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;">
        ${row('Entity', entityLabel(data.entityType))}
        ${row('Federal Tax ID', data.federalTaxId)}
        ${row('Bankruptcy', data.bankruptcyFiled ? `Yes${data.bankruptcyYear ? ` (${data.bankruptcyYear})` : ''}` : 'No')}
      </table>

      <h3 style="color:#35668d;margin-top:20px;font-size:14px;">Signatory</h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;">
        ${row('Name', data.signatoryName)}
        ${row('Title', data.signatoryTitle)}
        ${row('Email', data.signatoryEmail)}
        ${row('Phone', data.signatoryPhone)}
      </table>

      ${refs ? `<h3 style="color:#35668d;margin-top:20px;font-size:14px;">Trade References</h3><table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;">${refs}</table>` : ''}

      <p style="color:#6b7280;font-size:12px;margin-top:24px;">SEEK Equipment Rentals · 1-210-802-0000 · info@seekequipment.com</p>
    </div>
  `
}

function applicantAckHtml(
  data: ReturnType<typeof creditApplicationSchema.parse>,
  reference: string
) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color:#111827;">
      <h2 style="color:#35668d;margin-bottom:8px;">Application Received</h2>
      <p style="color:#6b7280;margin:0 0 16px 0;">Reference <strong style="color:#ee5519;">${reference}</strong></p>
      <p style="color:#374151;font-size:15px;">Dear ${data.signatoryName},</p>
      <p style="color:#374151;font-size:15px;">Thank you for applying for credit with SEEK Equipment Rentals. Your application has been received and our finance team will contact you as soon as possible.</p>
      <p style="color:#374151;font-size:15px;">A PDF copy of your submitted application is attached for your records.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="color:#6b7280;font-size:12px;">SEEK Equipment Rentals · 1-210-802-0000 · info@seekequipment.com · seekequipment.com</p>
    </div>
  `
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = creditApplicationSchema.safeParse(body)

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

    // Honeypot
    if (data.honeypot) {
      return NextResponse.json({ success: true, message: 'OK' })
    }

    const reference = await generateReference()
    const submittedAt = new Date()
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      null

    // Build PDF
    const pdfBytes = await buildCreditApplicationPdf({
      ...data,
      referenceNumber: reference,
      submittedAt,
      submitterIp: ip,
    })
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64')
    const pdfFilename = `credit-application-${reference}.pdf`

    // Persist (do NOT store raw SSN/DL/account numbers; keep last4 only)
    await query(
      `INSERT INTO credit_applications (
        reference_number, customer_name, customer_street, customer_city, customer_state, customer_zip, customer_phone,
        entity_type, previous_business_name, state_entity_formed, business_phone,
        bankruptcy_filed, bankruptcy_year, federal_tax_id, dnb_number, driver_license_last4, partners_members,
        signatory_name, signatory_title, signatory_address, signatory_phone, signatory_email,
        bank_name, bank_contact_name, bank_address, bank_account_number_last4, bank_transit,
        job_numbers_required, tax_exempt, insurance_company, insurance_contact_person, insurance_phone, certificate_forwarded,
        ap_contact, ap_email, ap_phone, trade_references,
        signature_confirmed, signature_name, signature_date, submitter_ip
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,
        $8,$9,$10,$11,
        $12,$13,$14,$15,$16,$17,
        $18,$19,$20,$21,$22,
        $23,$24,$25,$26,$27,
        $28,$29,$30,$31,$32,$33,
        $34,$35,$36,$37,
        $38,$39,$40,$41
      )`,
      [
        reference,
        data.customerName,
        data.customerStreet || null,
        data.customerCity || null,
        data.customerState || null,
        data.customerZip || null,
        data.customerPhone,
        data.entityType,
        data.previousBusinessName || null,
        data.stateEntityFormed || null,
        data.businessPhone || null,
        data.bankruptcyFiled,
        data.bankruptcyYear || null,
        data.federalTaxId || null,
        data.dnbNumber || null,
        last4(data.driverLicense),
        data.partnersMembers || null,
        data.signatoryName,
        data.signatoryTitle || null,
        data.signatoryAddress || null,
        data.signatoryPhone || null,
        data.signatoryEmail,
        data.bankName || null,
        data.bankContactName || null,
        data.bankAddress || null,
        last4(data.bankAccountNumber),
        data.bankTransit || null,
        data.jobNumbersRequired,
        data.taxExempt,
        data.insuranceCompany || null,
        data.insuranceContactPerson || null,
        data.insurancePhone || null,
        data.certificateForwarded,
        data.apContact || null,
        data.apEmail || null,
        data.apPhone || null,
        JSON.stringify(data.tradeReferences ?? []),
        Boolean(data.signatureConfirmed),
        data.signatureName,
        data.signatureDate,
        ip,
      ]
    )

    // Email via Resend
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      console.error('RESEND_API_KEY not configured for credit-application')
      return NextResponse.json(
        {
          success: false,
          message: 'Email service is not configured. Please contact SEEK Equipment directly.',
        },
        { status: 500 }
      )
    }

    const resend = new Resend(resendKey)

    await resend.emails.send({
      from: FROM_ADDRESS,
      to: RECIPIENT_PRIMARY,
      cc: RECIPIENT_CC,
      replyTo: data.signatoryEmail,
      subject: `New Credit Application — ${data.customerName} (${reference})`,
      html: summaryHtml(data, reference),
      attachments: [
        { filename: pdfFilename, content: pdfBase64 },
      ],
    })

    await resend.emails.send({
      from: FROM_ADDRESS,
      to: data.signatoryEmail,
      subject: `Application received — SEEK Equipment (${reference})`,
      html: applicantAckHtml(data, reference),
      attachments: [
        { filename: pdfFilename, content: pdfBase64 },
      ],
    })

    return NextResponse.json({
      success: true,
      reference,
      message: 'Application presented, we will contact you as soon as possible.',
    })
  } catch (error) {
    console.error(
      'Credit application error:',
      error instanceof Error ? error.message : error
    )
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
