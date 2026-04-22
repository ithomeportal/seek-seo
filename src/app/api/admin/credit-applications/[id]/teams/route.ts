import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { buildCreditApplicationPdf } from '@/lib/credit-application-pdf'
import type { CreditApplicationFormData } from '@/lib/validators'
import { postToTeams } from '@/lib/teams-webhook'

function buildSummaryHtml(row: Record<string, unknown>): string {
  const rowText = (label: string, value: unknown) =>
    `<tr><td style="padding:4px 10px;color:#6b7280;font-size:12px;">${label}</td><td style="padding:4px 10px;color:#111827;font-size:13px;font-weight:500;">${(value ?? '—') || '—'}</td></tr>`

  return `
    <div style="font-family: Arial, sans-serif; max-width: 640px; color:#111827;">
      <h2 style="color:#35668d;margin:0 0 4px 0;">New Credit Application</h2>
      <p style="color:#6b7280;margin:0 0 12px 0;">Reference <strong style="color:#ee5519;">${row.reference_number}</strong></p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;">
        ${rowText('Customer', row.customer_name)}
        ${rowText('Phone', row.customer_phone)}
        ${rowText('Entity', row.entity_type)}
        ${rowText('Fed Tax ID', row.federal_tax_id)}
        ${rowText('Signatory', row.signatory_name)}
        ${rowText('Email', row.signatory_email)}
        ${rowText('Submitted', new Date((row.created_at as string) ?? Date.now()).toLocaleString('en-US'))}
      </table>
    </div>
  `
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const numericId = Number(id)
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return NextResponse.json(
      { success: false, message: 'Invalid id' },
      { status: 400 }
    )
  }

  try {
    const result = await query(
      `SELECT * FROM credit_applications WHERE id = $1 LIMIT 1`,
      [numericId]
    )
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Not found' },
        { status: 404 }
      )
    }
    const row = result.rows[0] as Record<string, unknown>

    const data: CreditApplicationFormData = {
      customerName: (row.customer_name as string) ?? '',
      customerStreet: (row.customer_street as string) ?? '',
      customerCity: (row.customer_city as string) ?? '',
      customerState: (row.customer_state as string) ?? '',
      customerZip: (row.customer_zip as string) ?? '',
      customerPhone: (row.customer_phone as string) ?? '',
      entityType:
        (row.entity_type as CreditApplicationFormData['entityType']) ?? 'llc',
      previousBusinessName: (row.previous_business_name as string) ?? '',
      stateEntityFormed: (row.state_entity_formed as string) ?? '',
      businessPhone: (row.business_phone as string) ?? '',
      bankruptcyFiled: Boolean(row.bankruptcy_filed),
      bankruptcyYear: (row.bankruptcy_year as string) ?? '',
      federalTaxId: (row.federal_tax_id as string) ?? '',
      dnbNumber: (row.dnb_number as string) ?? '',
      driverLicense: (row.driver_license_last4 as string) ?? '',
      partnersMembers: (row.partners_members as string) ?? '',
      signatoryName: (row.signatory_name as string) ?? '',
      signatoryTitle: (row.signatory_title as string) ?? '',
      signatoryAddress: (row.signatory_address as string) ?? '',
      signatoryPhone: (row.signatory_phone as string) ?? '',
      signatoryEmail: (row.signatory_email as string) ?? '',
      bankName: (row.bank_name as string) ?? '',
      bankContactName: (row.bank_contact_name as string) ?? '',
      bankAddress: (row.bank_address as string) ?? '',
      bankAccountNumber: (row.bank_account_number_last4 as string) ?? '',
      bankTransit: (row.bank_transit as string) ?? '',
      jobNumbersRequired: Boolean(row.job_numbers_required),
      taxExempt: Boolean(row.tax_exempt),
      insuranceCompany: (row.insurance_company as string) ?? '',
      insuranceContactPerson: (row.insurance_contact_person as string) ?? '',
      insurancePhone: (row.insurance_phone as string) ?? '',
      certificateForwarded: Boolean(row.certificate_forwarded),
      apContact: (row.ap_contact as string) ?? '',
      apEmail: (row.ap_email as string) ?? '',
      apPhone: (row.ap_phone as string) ?? '',
      tradeReferences:
        (row.trade_references as CreditApplicationFormData['tradeReferences']) ??
        [],
      signatureConfirmed: Boolean(row.signature_confirmed) as unknown as true,
      signatureName: (row.signature_name as string) ?? '',
      signatureDate: row.signature_date
        ? new Date(row.signature_date as string).toISOString().slice(0, 10)
        : '',
      honeypot: '',
    }

    const pdfBytes = await buildCreditApplicationPdf({
      ...data,
      referenceNumber: row.reference_number as string,
      submittedAt: new Date(row.created_at as string),
      submitterIp: (row.submitter_ip as string) ?? null,
    })
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64')

    const teamsResult = await postToTeams({
      reference: row.reference_number as string,
      customerName: row.customer_name as string,
      customerPhone: (row.customer_phone as string) ?? null,
      signatoryName: row.signatory_name as string,
      signatoryEmail: row.signatory_email as string,
      signatoryPhone: (row.signatory_phone as string) ?? null,
      entityType: (row.entity_type as string) ?? null,
      federalTaxId: (row.federal_tax_id as string) ?? null,
      submittedAt: new Date((row.created_at as string) ?? Date.now()).toISOString(),
      summaryHtml: buildSummaryHtml(row),
      pdfBase64,
      pdfFilename: `credit-application-${row.reference_number}.pdf`,
    })

    if (!teamsResult.ok) {
      return NextResponse.json(
        {
          success: false,
          skipped: teamsResult.skipped ?? false,
          message:
            teamsResult.message ??
            'Teams webhook returned an error',
        },
        { status: teamsResult.skipped ? 503 : 502 }
      )
    }

    return NextResponse.json({ success: true, message: 'Posted to Teams' })
  } catch (error) {
    console.error(
      'Send to Teams error:',
      error instanceof Error ? error.message : error
    )
    return NextResponse.json(
      { success: false, message: 'Failed to send to Teams' },
      { status: 500 }
    )
  }
}
