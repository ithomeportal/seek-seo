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
      `SELECT sd.id, fu.unit_number, sd.deposit_date, sd.amount, sd.status
       FROM security_deposits sd
       JOIN rental_contracts rc ON sd.rental_contract_id = rc.id
       JOIN fleet_units fu ON rc.fleet_unit_id = fu.id
       WHERE sd.client_id = $1
       ORDER BY sd.deposit_date DESC`,
      [Number(clientId)]
    )

    const deposits = result.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      unitNumber: row.unit_number,
      depositDate: row.deposit_date,
      amount: Number(row.amount),
      status: row.status,
    }))

    return NextResponse.json({ success: true, data: deposits })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
