import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { query } from '@/lib/db'
import {
  buildHealthReport,
  GPS_HEALTH_QUERY,
  type GpsHealthUnitRow,
} from '@/lib/gps-health'
import {
  watchdogHtml,
  watchdogSubject,
  watchdogText,
} from '@/lib/gps-watchdog-email'

/**
 * GET /api/cron/gps-watchdog — the 08:00 America/Chicago tracker report.
 *
 * ⚠ Why two cron entries and an hour guard (vercel.json).
 *
 * Vercel cron schedules are UTC and do not observe DST, but San Antonio does.
 * A single UTC entry therefore drifts an hour twice a year — it would fire at
 * 7 AM half the year, which is exactly the kind of quiet wrongness this whole
 * feature exists to prevent. So `vercel.json` registers BOTH 13:00 and 14:00
 * UTC and this route sends only when the local Chicago hour is 8.
 *
 * Exactly one of those two UTC times maps to 08:00 Chicago at any point in the
 * year (13:00 during CDT, 14:00 during CST), so a double-send is structurally
 * impossible and no "already sent today" state table is needed.
 *
 * The report is sent EVERY day, including the all-clear. A watchdog that only
 * speaks up when something is wrong is indistinguishable from a watchdog that
 * has silently stopped running — which is the exact failure that let two
 * trackers sit dead for months.
 */

const SEND_LOCAL_HOUR = 8
const TIMEZONE = 'America/Chicago'

const DEFAULT_TO = 'rodney@seekequipment.com'
// Both cc addresses are tenant domains, so this stays a staff-facing send with
// no email-domain-policy conflict.
const DEFAULT_CC = 'dfrodriguez@unilinktransportation.com,emendoza@seekequipment.com'
const FROM = 'SEEK Equipment <noreply@unilinkportal.com>'

function isAuthorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    // No secret configured — only allow Vercel's internal cron user-agent.
    return (request.headers.get('user-agent') ?? '').includes('vercel-cron')
  }
  if (request.headers.get('authorization') === `Bearer ${expected}`) return true
  return request.headers.get('x-cron-secret') === expected
}

/** Current hour (0-23) in Chicago, DST included. */
function localHour(now: Date): number {
  const hour = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    hour12: false,
  }).format(now)
  return Number(hour) % 24
}

/** Comma/semicolon separated env override, trimmed and emptied-out. */
function recipients(envVar: string, fallback: string): string[] {
  const raw = (process.env[envVar] ?? '').trim()
  const list = (raw === '' ? fallback : raw)
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter((s) => s !== '')
  return list
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    )
  }

  const url = new URL(request.url)
  // `?force=1` bypasses the hour guard for a manual verification send.
  const force = url.searchParams.get('force') === '1'
  const now = new Date()
  const hour = localHour(now)

  if (!force && hour !== SEND_LOCAL_HOUR) {
    // The other of the two UTC entries owns today's send. Not an error.
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: `local hour ${hour} in ${TIMEZONE}; sends at ${SEND_LOCAL_HOUR}`,
    })
  }

  try {
    const result = await query<GpsHealthUnitRow>(GPS_HEALTH_QUERY)
    const report = buildHealthReport(result.rows, { now })

    const to = recipients('GPS_ALERT_TO', DEFAULT_TO)
    const cc = recipients('GPS_ALERT_CC', DEFAULT_CC)

    const apiKey = (process.env.RESEND_API_KEY ?? '').trim()
    if (!apiKey) {
      // Loud, not silent: no key means nobody is being warned about anything.
      console.error('[gps-watchdog] RESEND_API_KEY missing — no alert sent')
      return NextResponse.json(
        {
          success: false,
          reason: 'resend_not_configured',
          error: 'RESEND_API_KEY is not set; the daily GPS report was not sent',
          summary: report.counts,
        },
        { status: 500 }
      )
    }

    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      cc,
      subject: watchdogSubject(report),
      html: watchdogHtml(report),
      text: watchdogText(report),
    })

    if (error) {
      console.error('[gps-watchdog] Resend rejected the send:', error.message)
      return NextResponse.json(
        {
          success: false,
          reason: 'send_failed',
          error: error.message,
          summary: report.counts,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      sentTo: to,
      cc,
      feedDown: report.feedDown,
      problems: report.problems.length,
      summary: report.counts,
      totals: report.totals,
    })
  } catch (err) {
    console.error('[gps-watchdog] unhandled error:', err)
    // Non-200 so a broken watchdog is visible in Vercel's cron history rather
    // than being recorded as a successful run.
    return NextResponse.json(
      {
        success: false,
        reason: 'unhandled',
        error: err instanceof Error ? err.message : 'GPS watchdog failed',
      },
      { status: 500 }
    )
  }
}
