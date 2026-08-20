import { NextResponse } from 'next/server'
import { syncGpsPositions } from '@/lib/gps-sync'

/**
 * GET /api/cron/gps-sync — half-hourly SkyBitz position refresh.
 *
 * Exists because GPS positions previously only ever updated when a human
 * clicked "Refresh GPS" in the admin UI. Combined with a silent credential
 * failure that meant the map sat on four-month-old coordinates while looking
 * perfectly healthy.
 *
 * Auth mirrors /api/cron/onboarding-reminders.
 */
function isAuthorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    // No secret configured — only allow Vercel's internal cron user-agent.
    return (request.headers.get('user-agent') ?? '').includes('vercel-cron')
  }
  if (request.headers.get('authorization') === `Bearer ${expected}`) return true
  return request.headers.get('x-cron-secret') === expected
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const result = await syncGpsPositions()
    // Non-200 on failure so a dead feed shows up in Vercel's cron history
    // instead of being recorded as a successful run.
    return NextResponse.json(result, { status: result.success ? 200 : 502 })
  } catch (err) {
    console.error('[gps-sync] cron unhandled error:', err)
    return NextResponse.json(
      {
        success: false,
        reason: 'unhandled',
        error: err instanceof Error ? err.message : 'GPS sync failed',
      },
      { status: 500 }
    )
  }
}
