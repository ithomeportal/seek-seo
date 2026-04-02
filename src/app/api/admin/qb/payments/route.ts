import { NextResponse } from 'next/server'
import { qbQuery } from '@/lib/qb-db'

export async function GET() {
  try {
    const result = await qbQuery(
      `SELECT customer_name, total_amt, txn_date, payment_method
       FROM qb_payments
       WHERE total_amt > 0
       ORDER BY txn_date DESC`
    )

    const payments = result.rows.map((r: Record<string, unknown>) => ({
      customerName: r.customer_name as string,
      totalAmt: parseFloat(String(r.total_amt ?? '0')),
      txnDate: r.txn_date as string | null,
      paymentMethod: r.payment_method as string | null,
    }))

    const totalCollected = payments.reduce((s, p) => s + p.totalAmt, 0)

    return NextResponse.json({
      success: true,
      data: {
        payments,
        summary: {
          totalPayments: payments.length,
          totalCollected,
        },
      },
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch QB payments' },
      { status: 500 }
    )
  }
}
