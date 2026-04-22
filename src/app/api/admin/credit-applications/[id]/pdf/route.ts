import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { buildCreditApplicationPdf } from '@/lib/credit-application-pdf'
import type { CreditApplicationFormData } from '@/lib/validators'

export async function GET(
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

    const body = new Uint8Array(pdfBytes)
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="credit-application-${row.reference_number}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error(
      'PDF regen error:',
      error instanceof Error ? error.message : error
    )
    return NextResponse.json(
      { success: false, message: 'Failed to regenerate PDF' },
      { status: 500 }
    )
  }
}
