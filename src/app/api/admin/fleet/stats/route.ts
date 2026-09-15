import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    // Fleet status counts + revenue
    const statusResult = await query(
      `SELECT status, COUNT(*)::int AS count,
              COALESCE(SUM(rental_rate), 0)::float AS total_rate
       FROM fleet_units GROUP BY status`
    )

    // ⚠ The active-fleet total is derived by EXCLUSION, never from an allowlist
    // of known statuses. The switch this replaced had no case for
    // `lease_to_own`, so those units were silently absent from `total` — and
    // `total` is the utilization denominator, so utilization read HIGH and
    // nothing anywhere reported a problem. A status added later now counts by
    // default; only the ones listed here opt out.
    const EXCLUDED_FROM_ACTIVE_FLEET: readonly string[] = ['sold']

    const counts: Record<string, number> = {}
    let total = 0
    let expectedMonthlyRevenue = 0

    for (const row of statusResult.rows) {
      const status = String(row.status)
      const count = Number(row.count)
      counts[status] = count
      if (!EXCLUDED_FROM_ACTIVE_FLEET.includes(status)) total += count
      if (status === 'rented') expectedMonthlyRevenue = Number(row.total_rate)
    }

    const available = counts.available ?? 0
    const rented = counts.rented ?? 0
    const damaged = counts.damaged ?? 0
    const maintenance = counts.maintenance ?? 0
    const makeReady = counts.make_ready ?? 0
    const returnInspection = counts.return_inspection ?? 0
    const forSale = counts.for_sale ?? 0
    const leaseToOwn = counts.lease_to_own ?? 0
    // Lost/stolen units stay in the active fleet, like `damaged` — they are
    // still on the books until written off, and dropping them out of `total`
    // would make this endpoint disagree with the Fleet tab's own count.
    const lost = counts.lost ?? 0
    const stolen = counts.stolen ?? 0
    const sold = counts.sold ?? 0

    const utilizationRate =
      total > 0 ? Math.round((rented / total) * 1000) / 10 : 0

    // Deposits
    const depositResult = await query(
      `SELECT COALESCE(SUM(deposit_total), 0)::float AS total_deposits,
              COALESCE(SUM(pending_deposit), 0)::float AS total_pending
       FROM fleet_units WHERE customer_id IS NOT NULL`
    )
    const totalDepositsHeld = Number(depositResult.rows[0]?.total_deposits ?? 0)
    const totalPendingDeposits = Number(
      depositResult.rows[0]?.total_pending ?? 0
    )

    // Fleet by type (exclude sold)
    const typeResult = await query(
      `SELECT trailer_type, COUNT(*)::int AS count,
              SUM(CASE WHEN status = 'rented' THEN 1 ELSE 0 END)::int AS rented_count
       FROM fleet_units WHERE status != 'sold'
       GROUP BY trailer_type ORDER BY count DESC`
    )
    const byType = typeResult.rows.map(
      (row: Record<string, unknown>) => ({
        type: row.trailer_type as string,
        total: Number(row.count),
        rented: Number(row.rented_count),
      })
    )

    // Top customers (concentration)
    const concentrationResult = await query(
      `SELECT rented_to, COUNT(*)::int AS units,
              COALESCE(SUM(rental_rate), 0)::float AS revenue,
              COALESCE(SUM(deposit_total), 0)::float AS deposits
       FROM fleet_units
       WHERE status = 'rented' AND rented_to IS NOT NULL
       GROUP BY rented_to ORDER BY units DESC LIMIT 5`
    )
    const topCustomers = concentrationResult.rows.map(
      (row: Record<string, unknown>) => ({
        name: row.rented_to as string,
        units: Number(row.units),
        revenue: Number(row.revenue),
        deposits: Number(row.deposits),
        percentOfFleet:
          total > 0
            ? Math.round((Number(row.units) / total) * 1000) / 10
            : 0,
      })
    )

    // Active customer count
    const customerCountResult = await query(
      `SELECT COUNT(DISTINCT rented_to)::int AS count
       FROM fleet_units WHERE status = 'rented' AND rented_to IS NOT NULL`
    )
    const activeCustomers = Number(
      customerCountResult.rows[0]?.count ?? 0
    )

    return NextResponse.json({
      success: true,
      data: {
        total,
        available,
        rented,
        damaged,
        maintenance,
        makeReady,
        returnInspection,
        forSale,
        leaseToOwn,
        lost,
        stolen,
        sold,
        expectedMonthlyRevenue,
        utilizationRate,
        totalDepositsHeld,
        totalPendingDeposits,
        activeCustomers,
        byType,
        topCustomers,
      },
    })
  } catch (err) {
    // The user-facing message and the diagnostic record are never the same
    // object — see CLAUDE.md, "a friendly error message is not a log".
    const e = err as { message?: string; code?: string }
    console.error('[fleet/stats] query failed', e?.code ?? '-', e?.message ?? err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
