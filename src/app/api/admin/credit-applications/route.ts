import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query(
      `SELECT
         id, reference_number, customer_name, customer_phone,
         entity_type, signatory_name, signatory_email, signatory_phone,
         federal_tax_id, status, created_at
       FROM credit_applications
       ORDER BY created_at DESC
       LIMIT 500`
    )

    const rows = result.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      referenceNumber: row.reference_number,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      entityType: row.entity_type,
      signatoryName: row.signatory_name,
      signatoryEmail: row.signatory_email,
      signatoryPhone: row.signatory_phone,
      federalTaxId: row.federal_tax_id,
      status: row.status,
      createdAt: row.created_at,
    }))

    return NextResponse.json({ success: true, data: rows })
  } catch (error) {
    console.error(
      'Admin credit-applications fetch error:',
      error instanceof Error ? error.message : error
    )
    return NextResponse.json(
      { success: false, message: 'Failed to fetch applications' },
      { status: 500 }
    )
  }
}
