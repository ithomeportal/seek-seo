'use client'

/**
 * Tracker-health panel above the GPS map.
 *
 * Reads the same /api/admin/gps/health endpoint the 08:00 watchdog email is
 * built from, so what Rodney sees in the morning email and what the dashboard
 * shows can never diverge. The map alone cannot express this: a dead tracker
 * still has a pin, in a plausible place, because SkyBitz keeps serving its last
 * known position forever.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  SatelliteDish,
} from 'lucide-react'
import {
  TIER_COLOR,
  TIER_LABEL,
  formatAge,
  type GpsHealthReport,
  type GpsHealthTier,
} from '@/lib/gps-health'

const PROBLEM_TIERS: GpsHealthTier[] = ['never', 'dead', 'stale', 'warn', 'no_device']

function formatCentral(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function GpsHealthPanel() {
  const [report, setReport] = useState<GpsHealthReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/gps/health', { cache: 'no-store' })
      const json = await res.json()
      if (json.success) setReport(json.data)
      else setError(json.error ?? 'Failed to load tracker health')
    } catch {
      setError('Failed to load tracker health')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading && !report) {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2.5 mb-3 text-xs text-gray-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-blue" />
        Checking tracker health…
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 mb-3 text-xs text-red-700">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        {error || 'Tracker health unavailable'}
        <button onClick={load} className="ml-auto font-medium underline">
          Retry
        </button>
      </div>
    )
  }

  const t = report.thresholds
  const pills: { tier: GpsHealthTier; label: string }[] = [
    { tier: 'ok', label: 'Reporting' },
    { tier: 'warn', label: `Warn >${t.warnHours}h` },
    { tier: 'stale', label: `Stale >${t.staleHours}h` },
    { tier: 'dead', label: `Dead >${Math.round(t.deadHours / 24)}d` },
    { tier: 'never', label: 'Never' },
    { tier: 'no_device', label: 'No tracker' },
  ]

  return (
    <div className="rounded-lg border bg-white mb-3 overflow-hidden">
      <div className="flex items-center gap-2 flex-wrap px-3 py-2.5">
        <SatelliteDish className="h-4 w-4 text-brand-blue shrink-0" />
        <span className="text-xs font-semibold text-gray-800">Tracker Health</span>

        {report.feedDown ? (
          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700">
            <AlertTriangle className="h-3 w-3" />
            Feed down — last sync {formatCentral(report.lastSyncAt)}
          </span>
        ) : report.hasProblems ? (
          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800">
            <AlertTriangle className="h-3 w-3" />
            {report.problems.length} unit{report.problems.length === 1 ? '' : 's'} need attention
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3" />
            All {report.totals.alerting} units reporting
          </span>
        )}

        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          {pills.map((p) => (
            <span
              key={p.tier}
              title={TIER_LABEL[p.tier]}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: TIER_COLOR[p.tier] }}
            >
              {report.counts[p.tier]} {p.label}
            </span>
          ))}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-0.5 text-[11px] font-medium text-brand-blue hover:underline"
          >
            {expanded ? 'Hide' : 'Details'}
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t bg-gray-50/70 px-3 py-3">
          {report.problems.length === 0 ? (
            <p className="text-xs text-gray-500">
              Every monitored unit reported a position within the last {t.warnHours} hours.
            </p>
          ) : (
            <div className="overflow-x-auto rounded border bg-white">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="px-2 py-1.5 text-left font-medium text-gray-500">Unit</th>
                    <th className="px-2 py-1.5 text-left font-medium text-gray-500">Condition</th>
                    <th className="px-2 py-1.5 text-left font-medium text-gray-500">Status</th>
                    <th className="px-2 py-1.5 text-left font-medium text-gray-500">Rented to</th>
                    <th className="px-2 py-1.5 text-left font-medium text-gray-500">Last fix</th>
                    <th className="px-2 py-1.5 text-right font-medium text-gray-500">Age</th>
                    <th className="px-2 py-1.5 text-left font-medium text-gray-500">Last location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {PROBLEM_TIERS.flatMap((tier) =>
                    report.problems
                      .filter((u) => u.tier === tier)
                      .map((u) => (
                        <tr key={u.unitNumber} className="hover:bg-blue-50/30">
                          <td className="px-2 py-1 font-semibold text-gray-900">{u.unitNumber}</td>
                          <td className="px-2 py-1">
                            <span
                              className="inline-block rounded px-1.5 py-px text-[10px] font-medium text-white"
                              style={{ backgroundColor: TIER_COLOR[u.tier] }}
                            >
                              {TIER_LABEL[u.tier]}
                            </span>
                          </td>
                          <td className="px-2 py-1 text-gray-500">{u.status}</td>
                          <td className="px-2 py-1 text-gray-500">{u.rentedTo ?? '—'}</td>
                          <td className="px-2 py-1 text-gray-500">{formatCentral(u.lastGpsTime)}</td>
                          <td
                            className="px-2 py-1 text-right font-bold tabular-nums"
                            style={{ color: TIER_COLOR[u.tier] }}
                          >
                            {formatAge(u.ageHours)}
                          </td>
                          <td className="px-2 py-1 text-gray-400">{u.lastLocation ?? '—'}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
            Age is measured from the device&rsquo;s own last position fix, not from when we last
            called SkyBitz — SkyBitz keeps serving a dead tracker&rsquo;s last known position
            indefinitely, so a frozen unit looks healthy on the map.
            {report.totals.excluded > 0 && (
              <> {report.totals.excluded} sold unit
                {report.totals.excluded === 1 ? ' is' : 's are'} excluded;{' '}
                {report.totals.alerting} of {report.totals.fleet} units are monitored.</>
            )}{' '}
            A full report is emailed daily at 8:00 AM Central.
          </p>
        </div>
      )}
    </div>
  )
}
