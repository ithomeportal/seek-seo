import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const concentrationResult = await query(
      `SELECT rented_to, COUNT(*)::int AS units, COALESCE(SUM(rental_rate), 0)::float AS revenue
       FROM fleet_units
       WHERE status = 'rented' AND rented_to IS NOT NULL
       GROUP BY rented_to
       ORDER BY revenue DESC`
    )

    const totalsResult = await query(
      `SELECT COUNT(*)::int AS total_units, COALESCE(SUM(rental_rate), 0)::float AS total_revenue
       FROM fleet_units
       WHERE status = 'rented' AND rented_to IS NOT NULL`
    )

    const totalUnits = Number(totalsResult.rows[0]?.total_units ?? 0)
    const totalRevenue = Number(totalsResult.rows[0]?.total_revenue ?? 0)

    const concentration = concentrationResult.rows.map((row: Record<string, unknown>) => ({
      customer: row.rented_to,
      units: Number(row.units),
      unitPercentage: totalUnits > 0 ? Math.round((Number(row.units) / totalUnits) * 100 * 10) / 10 : 0,
      revenue: Number(row.revenue),
      revenuePercentage: totalRevenue > 0 ? Math.round((Number(row.revenue) / totalRevenue) * 100 * 10) / 10 : 0,
    }))

    return NextResponse.json({ success: true, data: concentration })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
