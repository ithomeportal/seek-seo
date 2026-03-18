import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query('SELECT status, COUNT(*)::int AS count, COALESCE(SUM(rental_rate), 0)::float AS total_rate FROM fleet_units GROUP BY status')

    let total = 0
    let available = 0
    let rented = 0
    let damaged = 0
    let maintenance = 0
    let forSale = 0
    let expectedMonthlyRevenue = 0

    for (const row of result.rows) {
      const count = Number(row.count)
      total += count

      switch (row.status) {
        case 'available':
          available = count
          break
        case 'rented':
          rented = count
          expectedMonthlyRevenue = Number(row.total_rate)
          break
        case 'damaged':
          damaged = count
          break
        case 'maintenance':
          maintenance = count
          break
        case 'for_sale':
          forSale = count
          break
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total,
        available,
        rented,
        damaged,
        maintenance,
        forSale,
        expectedMonthlyRevenue,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
