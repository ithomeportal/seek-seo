import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

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

    const data = {
      id: row.id,
      referenceNumber: row.reference_number,
      customerName: row.customer_name,
      customerStreet: row.customer_street,
      customerCity: row.customer_city,
      customerState: row.customer_state,
      customerZip: row.customer_zip,
      customerPhone: row.customer_phone,
      entityType: row.entity_type,
      previousBusinessName: row.previous_business_name,
      stateEntityFormed: row.state_entity_formed,
      businessPhone: row.business_phone,
      bankruptcyFiled: row.bankruptcy_filed,
      bankruptcyYear: row.bankruptcy_year,
      federalTaxId: row.federal_tax_id,
      dnbNumber: row.dnb_number,
      driverLicenseLast4: row.driver_license_last4,
      partnersMembers: row.partners_members,
      signatoryName: row.signatory_name,
      signatoryTitle: row.signatory_title,
      signatoryAddress: row.signatory_address,
      signatoryPhone: row.signatory_phone,
      signatoryEmail: row.signatory_email,
      bankName: row.bank_name,
      bankContactName: row.bank_contact_name,
      bankAddress: row.bank_address,
      bankAccountNumberLast4: row.bank_account_number_last4,
      bankTransit: row.bank_transit,
      jobNumbersRequired: row.job_numbers_required,
      taxExempt: row.tax_exempt,
      insuranceCompany: row.insurance_company,
      insuranceContactPerson: row.insurance_contact_person,
      insurancePhone: row.insurance_phone,
      certificateForwarded: row.certificate_forwarded,
      apContact: row.ap_contact,
      apEmail: row.ap_email,
      apPhone: row.ap_phone,
      tradeReferences: row.trade_references,
      signatureConfirmed: row.signature_confirmed,
      signatureName: row.signature_name,
      signatureDate: row.signature_date,
      submitterIp: row.submitter_ip,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error(
      'Admin credit-application fetch error:',
      error instanceof Error ? error.message : error
    )
    return NextResponse.json(
      { success: false, message: 'Failed to fetch application' },
      { status: 500 }
    )
  }
}
