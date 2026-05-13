import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { qbQuery } from '@/lib/qb-db'
import { readPortalSession } from '@/lib/portal-auth'

export async function GET() {
  const session = await readPortalSession()
  if (!session) {
    return NextResponse.json(
      { success: false, message: 'Not signed in' },
      { status: 401 }
    )
  }

  if (session.customerId === null) {
    return NextResponse.json({
      success: true,
      data: {
        activeRentals: 0,
        totalDepositsHeld: 0,
        balanceDue: 0,
        nextPaymentDue: null,
        hasRecord: false,
      },
    })
  }

  const customer = await query<{ qb_display_name: string | null }>(
    `SELECT qb_display_name FROM customers WHERE id = $1`,
    [session.customerId]
  )
  const qbDisplayName = customer.rows[0]?.qb_display_name ?? null

  const rentalsResult = await query<{
    active_rentals: string
    total_deposits: string
  }>(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'rented')::text AS active_rentals,
       COALESCE(SUM(deposit_total), 0)::text AS total_deposits
       FROM fleet_units WHERE customer_id = $1`,
    [session.customerId]
  )

  let balanceDue = 0
  let nextPaymentDue: { dueDate: string; amount: number; docNumber: string } | null = null

  if (qbDisplayName) {
    try {
      const balanceRow = await qbQuery<{ balance: string | null }>(
        `SELECT balance FROM qb_customers WHERE LOWER(display_name) = LOWER($1) LIMIT 1`,
        [qbDisplayName]
      )
      balanceDue = parseFloat(balanceRow.rows[0]?.balance ?? '0') || 0

      const nextDueRow = await qbQuery<{
        due_date: string | null
        balance: string | null
        doc_number: string | null
      }>(
        `SELECT due_date, balance, doc_number
           FROM qb_invoices
          WHERE LOWER(customer_name) = LOWER($1)
            AND balance::numeric > 0
            AND due_date IS NOT NULL
          ORDER BY due_date ASC
          LIMIT 1`,
        [qbDisplayName]
      )
      if (nextDueRow.rows.length > 0) {
        const r = nextDueRow.rows[0]
        nextPaymentDue = {
          dueDate: r.due_date as string,
          amount: parseFloat(r.balance ?? '0') || 0,
          docNumber: r.doc_number ?? '',
        }
      }
    } catch {
      // QB database may be unavailable — return zeros
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      activeRentals: parseInt(rentalsResult.rows[0]?.active_rentals ?? '0', 10),
      totalDepositsHeld: parseFloat(rentalsResult.rows[0]?.total_deposits ?? '0') || 0,
      balanceDue,
      nextPaymentDue,
      hasRecord: true,
    },
  })
}
