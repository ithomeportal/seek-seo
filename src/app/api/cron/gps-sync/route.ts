import { NextResponse } from 'next/server'
import { syncGpsPositions } from '@/lib/gps-sync'
import { reportFeedHealth } from '@/lib/gps-feed-alert'

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
    // Escalate a dead FEED immediately rather than waiting for the 08:00
    // watchdog — when the pipeline stops, every position freezes at once and
    // the map still looks healthy. Throttled and fully self-contained; it can
    // never throw into this handler.
    await reportFeedHealth(result)
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
