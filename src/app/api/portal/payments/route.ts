import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { qbQuery } from '@/lib/qb-db'
import { readPortalSession } from '@/lib/portal-auth'

interface QBPaymentRow {
  txn_date: string | null
  total_amt: string | null
  payment_method: string | null
}

export async function GET() {
  const session = await readPortalSession()
  if (!session) {
    return NextResponse.json(
      { success: false, message: 'Not signed in' },
      { status: 401 }
    )
  }

  if (session.customerId === null) {
    return NextResponse.json({ success: true, data: [] })
  }

  const customer = await query<{ qb_display_name: string | null }>(
    `SELECT qb_display_name FROM customers WHERE id = $1`,
    [session.customerId]
  )
  const qbDisplayName = customer.rows[0]?.qb_display_name
  if (!qbDisplayName) {
    return NextResponse.json({ success: true, data: [] })
  }

  try {
    const result = await qbQuery<QBPaymentRow>(
      `SELECT txn_date, total_amt, payment_method
         FROM qb_payments
        WHERE LOWER(customer_name) = LOWER($1)
        ORDER BY txn_date DESC NULLS LAST
        LIMIT 200`,
      [qbDisplayName]
    )

    const payments = result.rows.map((r) => ({
      txnDate: r.txn_date,
      amount: parseFloat(r.total_amt ?? '0') || 0,
      paymentMethod: r.payment_method,
    }))

    return NextResponse.json({ success: true, data: payments })
  } catch {
    return NextResponse.json({ success: true, data: [] })
  }
}
