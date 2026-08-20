import { NextResponse } from 'next/server'
import { syncGpsPositions } from '@/lib/gps-sync'
import { isConfigured } from '@/lib/skybitz'

/**
 * POST /api/admin/gps/skybitz — Refresh GPS positions from SkyBitz.
 *
 * Returns a non-200 on failure. The previous version answered 200 with
 * `{ success: false }` for every failure mode and the client discarded the
 * body entirely, so a dead feed was indistinguishable from a healthy one.
 */
export async function POST() {
  try {
    const result = await syncGpsPositions()
    return NextResponse.json(result, { status: result.success ? 200 : 502 })
  } catch (err) {
    console.error('[gps-sync] unhandled error:', err)
    return NextResponse.json(
      {
        success: false,
        reason: 'unhandled',
        error:
          err instanceof Error ? err.message : 'Failed to refresh SkyBitz positions',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/gps/skybitz — Connection status.
 *
 * Checks all three XML Legacy credentials. It used to check only two of the
 * three, so it reported `configured: true` while POST reported
 * `configured: false` on the very same deployment.
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    configured: isConfigured(),
    provider: 'SkyBitz (AMETEK)',
    authMode: 'XML Legacy',
  })
}
