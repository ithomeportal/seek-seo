import { NextResponse } from 'next/server'
import { qbQuery } from '@/lib/qb-db'

/**
 * Per-customer, per-month payment totals (Bruno 2026-09-15, ?tab=payments).
 *
 * ⚠ Grouped in SQL, deliberately, for two reasons the client cannot fix:
 *
 *  1. `txn_date` is a `DATE`. node-postgres parses it to a JS Date at
 *     server-local midnight, which `NextResponse.json` then serialises as a UTC
 *     instant ("2026-03-01T06:00:00.000Z"). Bucketing that with
 *     `new Date(iso).getMonth()` in a browser west of UTC drops a payment dated
 *     the 1st into the previous month — a rollup that is quietly wrong at every
 *     month boundary.
 *  2. `total_amt` is NUMERIC. Summing hundreds of `parseFloat`s accumulates
 *     binary-float error, so the rollup would disagree with the ledger by cents
 *     for no visible reason. `SUM(total_amt)` is exact.
 *
 * Payments with no `txn_date` belong to no month at all. They are counted and
 * returned separately rather than dropped, so the rollup can say out loud that
 * it does not cover them.
 */
const MONTHLY_SQL = `
  SELECT customer_name,
         EXTRACT(YEAR  FROM txn_date)::int AS year,
         EXTRACT(MONTH FROM txn_date)::int AS month,
         SUM(total_amt)::float             AS amount,
         COUNT(*)::int                     AS payment_count
    FROM qb_payments
   WHERE total_amt > 0
     AND txn_date IS NOT NULL
   GROUP BY customer_name, 2, 3
   ORDER BY 2 DESC, 3 DESC, customer_name ASC`

const UNDATED_SQL = `
  SELECT COUNT(*)::int AS payment_count,
         COALESCE(SUM(total_amt), 0)::float AS amount
    FROM qb_payments
   WHERE total_amt > 0
     AND txn_date IS NULL`

export async function GET() {
  try {
    const [result, monthlyResult, undatedResult] = await Promise.all([
      qbQuery(
        `SELECT customer_name, total_amt, txn_date, payment_method
         FROM qb_payments
         WHERE total_amt > 0
         ORDER BY txn_date DESC NULLS LAST`
      ),
      qbQuery(MONTHLY_SQL),
      qbQuery(UNDATED_SQL),
    ])

    const payments = result.rows.map((r: Record<string, unknown>) => ({
      customerName: r.customer_name as string,
      totalAmt: parseFloat(String(r.total_amt ?? '0')),
      txnDate: r.txn_date as string | null,
      paymentMethod: r.payment_method as string | null,
    }))

    const monthly = monthlyResult.rows.map((r: Record<string, unknown>) => ({
      customerName: r.customer_name as string,
      year: Number(r.year),
      month: Number(r.month),
      amount: Number(r.amount),
      paymentCount: Number(r.payment_count),
    }))

    const totalCollected = payments.reduce((s, p) => s + p.totalAmt, 0)
    const undatedRow = (undatedResult.rows[0] ?? {}) as Record<string, unknown>

    return NextResponse.json({
      success: true,
      data: {
        payments,
        monthly,
        summary: {
          totalPayments: payments.length,
          totalCollected,
          undatedPayments: Number(undatedRow.payment_count ?? 0),
          undatedAmount: Number(undatedRow.amount ?? 0),
        },
      },
    })
  } catch (err) {
    // The message the caller sees and the record we can debug from are never
    // the same object — see CLAUDE.md, "a friendly error message is not a log".
    const e = err as { message?: string; code?: string }
    console.error('[qb/payments] query failed', e?.code ?? '-', e?.message ?? err)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch QB payments' },
      { status: 500 }
    )
  }
}
