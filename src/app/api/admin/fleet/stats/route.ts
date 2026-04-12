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

    let total = 0
    let available = 0
    let rented = 0
    let damaged = 0
    let maintenance = 0
    let forSale = 0
    let sold = 0
    let expectedMonthlyRevenue = 0

    for (const row of statusResult.rows) {
      const count = Number(row.count)
      switch (row.status) {
        case 'available':
          available = count
          total += count
          break
        case 'rented':
          rented = count
          expectedMonthlyRevenue = Number(row.total_rate)
          total += count
          break
        case 'damaged':
          damaged = count
          total += count
          break
        case 'maintenance':
          maintenance = count
          total += count
          break
        case 'for_sale':
          forSale = count
          total += count
          break
        case 'sold':
          sold = count
          // Sold units excluded from total & stats
          break
      }
    }

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
        forSale,
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
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
