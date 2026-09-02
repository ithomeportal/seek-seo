/**
 * Daily GPS watchdog email — subject + HTML.
 *
 * Kept out of the route so `scripts/preview-gps-watchdog.mjs` can render the
 * exact production email against the live database without sending anything.
 */

import {
  TIER_COLOR,
  TIER_LABEL,
  formatAge,
  type GpsHealthReport,
  type GpsHealthTier,
  type GpsHealthUnit,
} from '@/lib/gps-health'

const ADMIN_GPS_URL = 'https://www.seekequipment.com/admin/dashboard?tab=gps'

/** Tier order inside the email body: worst first. */
const PROBLEM_TIERS: GpsHealthTier[] = ['never', 'dead', 'stale', 'warn', 'no_device']

function escapeHtml(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Central time, spelled out — the report is read in San Antonio. */
export function formatCentral(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

export function watchdogSubject(report: GpsHealthReport): string {
  const date = new Date(report.generatedAt).toLocaleDateString('en-US', {
    timeZone: 'America/Chicago',
    month: 'short',
    day: 'numeric',
  })
  if (report.feedDown) {
    return `⛔ SEEK GPS ALERT — the tracking feed is DOWN (${date})`
  }
  // `counts` is already monitored-only, so sold units cannot inflate this.
  const critical = report.counts.dead + report.counts.never
  if (critical > 0) {
    return `⚠ SEEK GPS — ${critical} tracker${critical === 1 ? '' : 's'} not reporting (${date})`
  }
  if (report.hasProblems) {
    return `SEEK GPS — ${report.problems.length} tracker${report.problems.length === 1 ? '' : 's'} need attention (${date})`
  }
  return `✅ SEEK GPS — all ${report.totals.alerting} units reporting (${date})`
}

function pill(label: string, value: number, color: string): string {
  return `
    <td style="padding:0 6px 0 0;">
      <div style="background:${color};color:#ffffff;border-radius:6px;padding:8px 10px;text-align:center;min-width:64px;">
        <div style="font-size:18px;font-weight:700;line-height:1.1;">${value}</div>
        <div style="font-size:9px;text-transform:uppercase;letter-spacing:.4px;opacity:.85;">${escapeHtml(label)}</div>
      </div>
    </td>`
}

function unitRows(units: GpsHealthUnit[]): string {
  return units
    .map(
      (u) => `
      <tr>
        <td style="padding:5px 8px;border-bottom:1px solid #eef0f3;font-weight:600;color:#111827;">${escapeHtml(u.unitNumber)}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #eef0f3;color:#6b7280;">${escapeHtml(u.status)}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #eef0f3;color:#6b7280;">${escapeHtml(u.rentedTo) || '—'}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #eef0f3;color:#111827;white-space:nowrap;">${formatCentral(u.lastGpsTime)}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #eef0f3;text-align:right;font-weight:700;color:${TIER_COLOR[u.tier]};white-space:nowrap;">${formatAge(u.ageHours)}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #eef0f3;color:#6b7280;">${escapeHtml(u.lastLocation) || '—'}</td>
      </tr>`
    )
    .join('')
}

function tierSection(tier: GpsHealthTier, units: GpsHealthUnit[]): string {
  if (units.length === 0) return ''
  const note =
    tier === 'no_device'
      ? ' — no SkyBitz device assigned to this unit at all'
      : tier === 'never'
        ? ' — device assigned but it has never sent a position'
        : ''
  return `
    <h3 style="font-size:13px;margin:20px 0 6px;color:${TIER_COLOR[tier]};">
      ${TIER_LABEL[tier]} (${units.length})<span style="font-weight:400;color:#6b7280;">${note}</span>
    </h3>
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:11px;">
      <thead>
        <tr style="background:#f7f8fa;">
          <th align="left" style="padding:5px 8px;color:#6b7280;font-weight:600;">Unit</th>
          <th align="left" style="padding:5px 8px;color:#6b7280;font-weight:600;">Status</th>
          <th align="left" style="padding:5px 8px;color:#6b7280;font-weight:600;">Rented to</th>
          <th align="left" style="padding:5px 8px;color:#6b7280;font-weight:600;">Last fix</th>
          <th align="right" style="padding:5px 8px;color:#6b7280;font-weight:600;">Age</th>
          <th align="left" style="padding:5px 8px;color:#6b7280;font-weight:600;">Last known location</th>
        </tr>
      </thead>
      <tbody>${unitRows(units)}</tbody>
    </table>`
}

export function watchdogHtml(report: GpsHealthReport): string {
  const t = report.thresholds

  const feedBanner = report.feedDown
    ? `
      <div style="background:#7f1d1d;color:#ffffff;border-radius:8px;padding:14px 16px;margin-bottom:18px;">
        <div style="font-size:15px;font-weight:700;margin-bottom:4px;">⛔ The GPS feed itself is not running</div>
        <div style="font-size:12px;line-height:1.5;">
          The last successful SkyBitz sync was <strong>${formatCentral(report.lastSyncAt)}</strong>
          (${report.syncAgeHours === null ? 'never' : `${report.syncAgeHours} h ago`}).
          It should run every 30 minutes. Until this is fixed <strong>every position below is
          frozen</strong> and the per-unit ages cannot be trusted.
        </div>
      </div>`
    : ''

  const allClear =
    !report.hasProblems && !report.feedDown
      ? `
      <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:14px 16px;margin-bottom:18px;">
        <div style="font-size:14px;font-weight:700;color:#065f46;">✅ All clear</div>
        <div style="font-size:12px;color:#047857;margin-top:3px;">
          All ${report.totals.alerting} in-service units reported a position within the last ${t.warnHours} hours.
        </div>
      </div>`
      : ''

  const sections = PROBLEM_TIERS.map((tier) =>
    tierSection(
      tier,
      report.problems.filter((u) => u.tier === tier)
    )
  ).join('')

  const excludedNote =
    report.totals.excluded > 0
      ? `<li>${report.totals.excluded} sold unit${report.totals.excluded === 1 ? '' : 's'} excluded from the checks above (no longer our equipment), so ${report.totals.alerting} of ${report.totals.fleet} units are monitored.</li>`
      : ''

  return `
  <div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:760px;margin:0 auto;padding:24px;color:#111827;">
    <h2 style="color:#35668d;margin:0 0 2px;font-size:19px;">SEEK Equipment — Daily GPS Tracker Watchdog</h2>
    <p style="color:#6b7280;font-size:12px;margin:0 0 18px;">
      ${formatCentral(report.generatedAt)} &middot; every unit in inventory, rented or not
    </p>

    ${feedBanner}
    ${allClear}

    <table cellpadding="0" cellspacing="0" style="border-collapse:separate;margin-bottom:4px;">
      <tr>
        ${pill('Reporting', report.counts.ok, TIER_COLOR.ok)}
        ${pill(`Warn >${t.warnHours}h`, report.counts.warn, TIER_COLOR.warn)}
        ${pill(`Stale >${t.staleHours}h`, report.counts.stale, TIER_COLOR.stale)}
        ${pill(`Dead >${Math.round(t.deadHours / 24)}d`, report.counts.dead, TIER_COLOR.dead)}
        ${pill('Never', report.counts.never, TIER_COLOR.never)}
        ${pill('No tracker', report.counts.no_device, TIER_COLOR.no_device)}
      </tr>
    </table>

    ${sections}

    <p style="margin:22px 0 6px;">
      <a href="${ADMIN_GPS_URL}"
         style="background:#ee5519;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px;display:inline-block;">
        Open the GPS map
      </a>
    </p>

    <div style="margin-top:22px;padding-top:14px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:11px;line-height:1.6;">
      <strong style="color:#374151;">How this is measured</strong>
      <ul style="margin:6px 0 0;padding-left:18px;">
        <li>Age is measured from the <strong>device's own last position fix</strong>, not from when
            we last called SkyBitz. SkyBitz keeps serving a dead tracker's last known position
            indefinitely, so a frozen unit otherwise looks perfectly healthy on the map.</li>
        <li>Thresholds: warning at ${t.warnHours} h, stale at ${t.staleHours} h,
            dead at ${Math.round(t.deadHours / 24)} days.</li>
        ${excludedNote}
        <li>This email is sent every morning at 8:00 AM Central whether or not anything is wrong —
            silence would be indistinguishable from a healthy fleet.</li>
      </ul>
    </div>
  </div>`
}

/** Plain-text fallback, so the alert survives a text-only mail client. */
export function watchdogText(report: GpsHealthReport): string {
  const lines: string[] = []
  lines.push('SEEK Equipment — Daily GPS Tracker Watchdog')
  lines.push(formatCentral(report.generatedAt))
  lines.push('')
  if (report.feedDown) {
    lines.push('*** THE GPS FEED ITSELF IS NOT RUNNING ***')
    lines.push(`Last successful SkyBitz sync: ${formatCentral(report.lastSyncAt)}`)
    lines.push('Every position below is frozen until this is fixed.')
    lines.push('')
  }
  lines.push(
    `Reporting ${report.counts.ok} · Warn ${report.counts.warn} · Stale ${report.counts.stale} · ` +
      `Dead ${report.counts.dead} · Never ${report.counts.never} · No tracker ${report.counts.no_device}`
  )
  lines.push('')
  if (report.problems.length === 0) {
    lines.push(`All clear — all ${report.totals.alerting} in-service units are reporting.`)
  } else {
    for (const tier of PROBLEM_TIERS) {
      const units = report.problems.filter((u) => u.tier === tier)
      if (units.length === 0) continue
      lines.push(`${TIER_LABEL[tier]} (${units.length}):`)
      for (const u of units) {
        lines.push(
          `  ${u.unitNumber} [${u.status}]${u.rentedTo ? ` — ${u.rentedTo}` : ''} — ` +
            `last fix ${formatCentral(u.lastGpsTime)} (${formatAge(u.ageHours)})`
        )
      }
      lines.push('')
    }
  }
  lines.push(ADMIN_GPS_URL)
  return lines.join('\n')
}
