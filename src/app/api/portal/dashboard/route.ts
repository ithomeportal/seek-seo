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
    const id = Number(clientId)

    const [unitsResult, depositsResult, owedResult, nextPaymentResult] = await Promise.all([
      query(
        `SELECT COUNT(*)::int AS total
         FROM rental_contracts
         WHERE client_id = $1 AND status = 'active'`,
        [id]
      ),
      query(
        `SELECT COALESCE(SUM(amount), 0)::float AS total
         FROM security_deposits
         WHERE client_id = $1 AND status = 'held'`,
        [id]
      ),
      query(
        `SELECT COALESCE(SUM(amount), 0)::float AS total
         FROM invoices
         WHERE client_id = $1 AND status = 'open'`,
        [id]
      ),
      query(
        `SELECT due_date, amount
         FROM invoices
         WHERE client_id = $1 AND status = 'open'
         ORDER BY due_date ASC
         LIMIT 1`,
        [id]
      ),
    ])

    const nextPayment = nextPaymentResult.rows.length > 0
      ? { date: nextPaymentResult.rows[0].due_date, amount: Number(nextPaymentResult.rows[0].amount) }
      : null

    return NextResponse.json({
      success: true,
      data: {
        totalUnitsRented: Number(unitsResult.rows[0].total),
        totalSecurityDeposits: Number(depositsResult.rows[0].total),
        amountOwed: Number(owedResult.rows[0].total),
        nextPaymentDue: nextPayment,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
