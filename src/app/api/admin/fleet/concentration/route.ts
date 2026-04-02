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
      `SELECT COUNT(*)::int AS total_fleet FROM fleet_units`
    )

    const totalFleet = Number(totalsResult.rows[0]?.total_fleet ?? 0)

    const data = concentrationResult.rows.map((row: Record<string, unknown>) => ({
      customer: row.rented_to as string,
      unitCount: Number(row.units),
      percentOfFleet:
        totalFleet > 0
          ? Math.round((Number(row.units) / totalFleet) * 1000) / 10
          : 0,
      monthlyRevenue: Number(row.revenue),
    }))

    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
