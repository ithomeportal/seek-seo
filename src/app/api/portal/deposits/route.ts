import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { readPortalSession } from '@/lib/portal-auth'

interface DepositRow {
  unit_number: string
  trailer_type: string
  rent_start_date: string | null
  deposit_total: string | null
  pending_deposit: string | null
  status: string
}

/**
 * Statuses where SEEK still holds the customer's deposit. A unit that is out,
 * being bought out, or unaccounted for has not had its deposit returned.
 */
const HELD_DEPOSIT_STATUSES: readonly string[] = [
  'rented',
  'lease_to_own',
  'lost',
  'stolen',
]

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

  const result = await query<DepositRow>(
    `SELECT unit_number, trailer_type, rent_start_date,
            deposit_total, pending_deposit, status
       FROM fleet_units
      WHERE customer_id = $1
        AND ( (deposit_total IS NOT NULL AND deposit_total::numeric > 0)
              OR (pending_deposit IS NOT NULL AND pending_deposit::numeric > 0) )
      ORDER BY unit_number ASC`,
    [session.customerId]
  )

  const deposits = result.rows.map((r) => ({
    unitNumber: r.unit_number,
    trailerType: r.trailer_type,
    rentStartDate: r.rent_start_date,
    depositTotal: r.deposit_total ? parseFloat(r.deposit_total) : 0,
    pendingDeposit: r.pending_deposit ? parseFloat(r.pending_deposit) : 0,
    // ⚠ This is CUSTOMER-facing, so the fallback has to be the true statement,
    // not the common one. `=== 'rented' ? 'held' : 'refunded'` told a customer
    // their deposit was refunded for any status but `rented` — including
    // lease-to-own, and (once those statuses existed) lost and stolen, where we
    // are still holding their money. Held is an allowlist of "the deposit cycle
    // has not closed"; anything else genuinely came back to them.
    status: HELD_DEPOSIT_STATUSES.includes(r.status) ? 'held' : 'refunded',
  }))

  return NextResponse.json({ success: true, data: deposits })
}
