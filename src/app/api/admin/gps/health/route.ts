import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import {
  buildHealthReport,
  GPS_HEALTH_QUERY,
  type GpsHealthUnitRow,
} from '@/lib/gps-health'

/**
 * GET /api/admin/gps/health — tracker health for the whole fleet.
 *
 * Same query and same classifier the daily watchdog email uses, so the admin
 * panel and the 08:00 email can never tell two different stories.
 */
export async function GET() {
  try {
    const result = await query<GpsHealthUnitRow>(GPS_HEALTH_QUERY)
    const report = buildHealthReport(result.rows)
    return NextResponse.json({ success: true, data: report })
  } catch (err) {
    console.error('[gps-health] query failed:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to compute GPS health' },
      { status: 500 }
    )
  }
}
