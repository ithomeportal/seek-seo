import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')

  if (!clientId || isNaN(Number(clientId))) {
    return NextResponse.json(
      { success: false, error: 'Valid clientId is required' },
      { status: 400 }
    )
  }

  try {
    const result = await query(
      `SELECT rc.id, fu.make AS unit_make, fu.model AS unit_model, fu.year AS unit_year,
              fu.unit_number, rc.status, rc.start_date, rc.end_date,
              rc.monthly_rate, rc.end_date AS contract_end_date,
              rc.lease_agreement_url
       FROM rental_contracts rc
       JOIN fleet_units fu ON rc.fleet_unit_id = fu.id
       WHERE rc.client_id = $1
       ORDER BY rc.start_date DESC`,
      [Number(clientId)]
    )

    const now = new Date()
    const contracts = result.rows.map((row: Record<string, unknown>) => {
      const endDate = row.contract_end_date ? new Date(String(row.contract_end_date)) : null
      const daysRemaining = endDate
        ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : null

      return {
        id: row.id,
        unitMake: row.unit_make,
        unitModel: row.unit_model,
        unitYear: row.unit_year,
        unitNumber: row.unit_number,
        status: row.status,
        startDate: row.start_date,
        endDate: row.end_date,
        monthlyRate: Number(row.monthly_rate),
        daysRemaining,
        leaseAgreementUrl: row.lease_agreement_url,
      }
    })

    return NextResponse.json({ success: true, data: contracts })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
