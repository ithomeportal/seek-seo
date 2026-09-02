/**
 * Immediate escalation when the SkyBitz feed itself stops.
 *
 * The daily 08:00 watchdog covers individual trackers going quiet. A dead FEED
 * is a different, larger failure — every position freezes at once — and waiting
 * until the next morning to say so is how a credential typo turned into a
 * four-month outage in 2026. This fires from the half-hourly sync, throttled so
 * a sustained outage produces one email every `THROTTLE_HOURS`, not 48 a day.
 *
 * The throttle ledger lives in `system_alert_log` (see
 * scripts/migrate-gps-watchdog-alerts.mjs). Every failure here is swallowed and
 * logged: an alerting problem must never take down the sync it is watching.
 */

import { Resend } from 'resend'
import { query } from '@/lib/db'
import type { GpsSyncResult } from '@/lib/gps-sync'

const ALERT_KEY = 'gps_feed_down'
const THROTTLE_HOURS = 6
const FROM = 'SEEK Equipment <noreply@unilinkportal.com>'
const DEFAULT_TO = 'rodney@seekequipment.com'
const DEFAULT_CC = 'dfrodriguez@unilinktransportation.com'
const ADMIN_GPS_URL = 'https://www.seekequipment.com/admin/dashboard?tab=gps'

/** Human explanation per SkyBitz failure reason — what to actually go and do. */
const REASON_GUIDANCE: Record<string, string> = {
  not_configured:
    'One or more SKYBITZ_* environment variables are missing in Vercel. Note that Vercel snapshots environment variables at BUILD time, so setting them requires a redeploy, not just a restart.',
  skybitz_error:
    'SkyBitz accepted the request but rejected it. "Invalid login credentials" here has previously meant a trailing newline stored in the credential, which is encoded as %0A into the username or password.',
  http_error: 'SkyBitz returned an HTTP error. Likely a provider-side outage.',
  network_error: 'We could not reach SkyBitz at all. Likely a provider-side outage.',
  no_positions:
    'SkyBitz authenticated us but returned no assets. The account may have been changed on their side.',
}

function recipients(envVar: string, fallback: string): string[] {
  const raw = (process.env[envVar] ?? '').trim()
  return (raw === '' ? fallback : raw)
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter((s) => s !== '')
}

/**
 * Claim the right to send. Returns true only if no alert for this key has gone
 * out within the throttle window; the claim and the check are one statement so
 * two concurrent syncs cannot both send.
 */
async function claimSendSlot(detail: string): Promise<boolean> {
  const result = await query<{ alert_key: string }>(
    `INSERT INTO system_alert_log (alert_key, last_sent_at, detail)
          VALUES ($1, NOW(), $2)
     ON CONFLICT (alert_key) DO UPDATE
            SET last_sent_at = NOW(),
                detail = EXCLUDED.detail
          WHERE system_alert_log.last_sent_at < NOW() - INTERVAL '${THROTTLE_HOURS} hours'
      RETURNING alert_key`,
    [ALERT_KEY, detail]
  )
  return result.rowCount === 1
}

/** Clear the throttle once the feed recovers, so the next outage alerts at once. */
async function clearSendSlot(): Promise<void> {
  await query(`DELETE FROM system_alert_log WHERE alert_key = $1`, [ALERT_KEY])
}

function alertHtml(reason: string, detail: string): string {
  const guidance =
    REASON_GUIDANCE[reason] ?? 'The GPS position sync failed for an unexpected reason.'
  return `
  <div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111827;">
    <div style="background:#7f1d1d;color:#fff;border-radius:8px;padding:14px 16px;margin-bottom:18px;">
      <div style="font-size:16px;font-weight:700;">⛔ The SEEK GPS feed has stopped</div>
      <div style="font-size:12px;margin-top:4px;opacity:.9;">
        No new positions are being recorded. Every unit on the map is now frozen at its last
        known location and will look normal.
      </div>
    </div>
    <table cellpadding="0" cellspacing="0" style="width:100%;font-size:12px;border-collapse:collapse;">
      <tr><td style="padding:5px 0;color:#6b7280;width:110px;">Failure</td><td style="padding:5px 0;font-weight:600;">${reason}</td></tr>
      <tr><td style="padding:5px 0;color:#6b7280;">Detail</td><td style="padding:5px 0;">${detail}</td></tr>
      <tr><td style="padding:5px 0;color:#6b7280;">Detected</td><td style="padding:5px 0;">${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago', timeZoneName: 'short' })}</td></tr>
    </table>
    <p style="font-size:12px;color:#374151;line-height:1.6;margin-top:16px;">${guidance}</p>
    <p style="margin-top:18px;">
      <a href="${ADMIN_GPS_URL}" style="background:#ee5519;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px;">Open the GPS map</a>
    </p>
    <p style="color:#9ca3af;font-size:11px;margin-top:18px;">
      Sent at most once every ${THROTTLE_HOURS} hours while the outage lasts. The daily 8:00 AM
      tracker report covers individual units.
    </p>
  </div>`
}

/**
 * Call after every sync attempt. Sends on a fresh failure, and silently resets
 * the throttle on success so a recovery is not mistaken for a continuing outage.
 */
export async function reportFeedHealth(result: GpsSyncResult): Promise<void> {
  try {
    // A partial failure (some UPDATEs threw) is not a feed outage — the daily
    // report covers those units. Only a fetch-level failure means "no data".
    const feedDown = !result.success && !!result.reason && result.totalPositions === 0
    if (!feedDown) {
      await clearSendSlot()
      return
    }

    const reason = result.reason ?? 'unknown'
    const detail = result.error ?? 'No detail provided'

    if (!(await claimSendSlot(`${reason}: ${detail}`))) return

    const apiKey = (process.env.RESEND_API_KEY ?? '').trim()
    if (!apiKey) {
      console.error('[gps-feed-alert] RESEND_API_KEY missing — feed-down alert not sent')
      return
    }

    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: FROM,
      to: recipients('GPS_ALERT_TO', DEFAULT_TO),
      cc: recipients('GPS_ALERT_CC', DEFAULT_CC),
      subject: '⛔ SEEK GPS ALERT — the tracking feed has stopped',
      html: alertHtml(reason, detail),
      text:
        `The SEEK GPS feed has stopped.\n\n` +
        `Failure: ${reason}\nDetail: ${detail}\n\n` +
        `No new positions are being recorded; every unit on the map is frozen ` +
        `at its last known location.\n\n${ADMIN_GPS_URL}`,
    })
    if (error) {
      console.error('[gps-feed-alert] Resend rejected the send:', error.message)
    }
  } catch (err) {
    // Never let the watchdog break the thing it watches.
    console.error('[gps-feed-alert] failed to report feed health:', err)
  }
}
