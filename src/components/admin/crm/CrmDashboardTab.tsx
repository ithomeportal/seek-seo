'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, RotateCw } from 'lucide-react'
import { crmTrailerLabel } from '@/lib/crm'
import { crmFetch, formatCurrency } from './types'

interface DashboardData {
  kpis: {
    openDeals: number
    wonDeals: number
    lostDeals: number
    pipelineMonthly: number
    weightedMonthly: number
    wonContractValue: number
    winRate: number
    totalTrailers: number
    available: number
    rented: number
    maintenance: number
    utilization: number
    idleRevenueLost: number
    cumulativeIdleDays: number
    idleLossInRange: number
    idleRangeFrom: string
    idleRangeTo: string
    avgRentalsPerMonth: number
    monthsToLeaseAll: number | null
    totalLeads: number
    lostMonthlyTotal: number
  }
  lostMonthlyByType: Array<{
    trailerType: string
    units: number
    available: number
    maintenance: number
    avgMonthlyRate: number
    lostMonthly: number
  }>
  idleLossByType: Array<{ trailerType: string; units: number; days: number; lost: number }>
  fleetByType: Array<{
    trailerType: string
    total: number
    available: number
    rented: number
    maintenance: number
    utilization: number
    avgIdleDays: number
    maxIdleDays: number
    revenueLost: number
  }>
  velocity: {
    months: number
    totalRecent: number
    avgPerMonth: number
    monthsToLeaseAll: number | null
    byType: Array<{
      trailerType: string
      rentedInPeriod: number
      avgPerMonth: number
      available: number
      monthsToLeaseAll: number | null
    }>
  }
  pipeline: {
    byStage: Array<{ stage: string; count: number; monthlyRevenue: number }>
    byRegion: Array<{ region: string; count: number; monthlyRevenue: number }>
    byTrailerType: Array<{ trailerType: string; count: number; units: number; monthlyRevenue: number }>
    leadFunnel: Array<{ status: string; count: number }>
    leadToQualified: number
    leadToWon: number
  }
  dealsByStage: Array<{ stage: string; probability: number; count: number }>
}

const FUNNEL_TONES: Record<string, string> = {
  New: 'bg-sky-50 text-sky-900 border-sky-200',
  Contacted: 'bg-indigo-50 text-indigo-900 border-indigo-200',
  Qualified: 'bg-violet-50 text-violet-900 border-violet-200',
  'Proposal Sent': 'bg-amber-50 text-amber-900 border-amber-200',
  Won: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  Lost: 'bg-rose-50 text-rose-900 border-rose-200',
}

export default function CrmDashboardTab() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [idleFrom, setIdleFrom] = useState('')
  const [idleTo, setIdleTo] = useState('')

  const load = useCallback(async (from?: string, to?: string) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (from) params.set('idleFrom', from)
      if (to) params.set('idleTo', to)
      const qs = params.toString()
      const d = await crmFetch<DashboardData>(`/api/admin/crm/analytics/dashboard${qs ? `?${qs}` : ''}`)
      setData(d)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading CRM dashboard…
      </div>
    )
  }
  if (error && !data) {
    return <div className="p-6 text-base text-red-600">{error}</div>
  }
  if (!data) return null

  const { kpis, pipeline, dealsByStage } = data
  const funnelTotal = pipeline.leadFunnel.reduce((s, x) => s + x.count, 0)
  const maxRegionRevenue = Math.max(1, ...pipeline.byRegion.map((r) => r.monthlyRevenue))
  const maxTypeRevenue = Math.max(1, ...pipeline.byTrailerType.map((t) => t.monthlyRevenue))

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Open Pipeline (monthly)</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(kpis.pipelineMonthly)}</p>
          <p className="text-sm text-gray-500 mt-1">
            Weighted: <span className="font-semibold text-gray-700">{formatCurrency(kpis.weightedMonthly)}</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Won Deals</p>
          <p className="text-xl font-bold text-gray-900">{kpis.wonDeals}</p>
          <p className="text-sm text-gray-500 mt-1">
            Contract value:{' '}
            <span className="font-semibold text-gray-700">{formatCurrency(kpis.wonContractValue)}</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Win Rate</p>
          <p className="text-xl font-bold text-gray-900">{kpis.winRate.toFixed(0)}%</p>
          <p className="text-sm text-gray-500 mt-1">
            {kpis.openDeals} open · {kpis.lostDeals} lost
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Fleet Utilization</p>
          <p className="text-xl font-bold text-gray-900">{kpis.utilization.toFixed(0)}%</p>
          <p className="text-sm text-gray-500 mt-1">
            {kpis.rented} rented / {kpis.totalTrailers} units (sold excluded)
          </p>
        </div>
      </div>

      {/* Lead funnel */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-base font-bold text-gray-900">Lead Funnel</h3>
          <p className="text-sm text-gray-500">
            {kpis.totalLeads} leads · Lead→Qualified {pipeline.leadToQualified.toFixed(0)}% · Lead→Won{' '}
            {pipeline.leadToWon.toFixed(0)}%
          </p>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {pipeline.leadFunnel.map((cell) => (
            <div
              key={cell.status}
              className={`rounded-lg border p-3 text-center ${FUNNEL_TONES[cell.status] ?? 'bg-gray-50 border-gray-200'}`}
            >
              <p className="text-2xl font-bold">{cell.count}</p>
              <p className="text-xs font-semibold uppercase tracking-wide mt-1">{cell.status}</p>
              <p className="text-xs mt-0.5 opacity-70">
                {funnelTotal ? ((cell.count / funnelTotal) * 100).toFixed(0) : 0}%
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Stage probability table */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-base font-bold text-gray-900 mb-3">Deals by Stage</h3>
          <table className="w-full text-base">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="py-1.5 pr-2 font-semibold">Stage</th>
                <th className="py-1.5 pr-2 font-semibold">Probability</th>
                <th className="py-1.5 pr-2 font-semibold text-right">Deals</th>
                <th className="py-1.5 font-semibold text-right">Monthly Revenue</th>
              </tr>
            </thead>
            <tbody>
              {dealsByStage.map((row) => {
                const stageRev = pipeline.byStage.find((s) => s.stage === row.stage)
                return (
                  <tr key={row.stage} className="border-b last:border-0">
                    <td className="py-1.5 pr-2 text-gray-900">{row.stage}</td>
                    <td className="py-1.5 pr-2 text-gray-600">{row.probability}%</td>
                    <td className="py-1.5 pr-2 text-right font-semibold text-gray-900">{row.count}</td>
                    <td className="py-1.5 text-right text-gray-700">
                      {formatCurrency(stageRev?.monthlyRevenue ?? 0)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pipeline by region */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-base font-bold text-gray-900 mb-3">Pipeline by Region</h3>
          {pipeline.byRegion.length === 0 ? (
            <p className="text-base text-gray-500">No deals with a region yet.</p>
          ) : (
            <div className="space-y-2">
              {pipeline.byRegion.map((r) => (
                <div key={r.region}>
                  <div className="flex items-center justify-between text-sm mb-0.5">
                    <span className="text-gray-700 font-medium">{r.region}</span>
                    <span className="text-gray-500">
                      {r.count} deal{r.count === 1 ? '' : 's'} · {formatCurrency(r.monthlyRevenue)}/mo
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-orange rounded-full"
                      style={{ width: `${(r.monthlyRevenue / maxRegionRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pipeline by trailer type */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-base font-bold text-gray-900 mb-3">Pipeline by Trailer Type</h3>
        <div className="space-y-2">
          {pipeline.byTrailerType
            .filter((t) => t.count > 0 || t.monthlyRevenue > 0)
            .map((t) => (
              <div key={t.trailerType}>
                <div className="flex items-center justify-between text-sm mb-0.5">
                  <span className="text-gray-700 font-medium">{crmTrailerLabel(t.trailerType)}</span>
                  <span className="text-gray-500">
                    {t.count} deal{t.count === 1 ? '' : 's'} · {t.units} units · {formatCurrency(t.monthlyRevenue)}/mo
                  </span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-blue rounded-full"
                    style={{ width: `${(t.monthlyRevenue / maxTypeRevenue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          {pipeline.byTrailerType.every((t) => t.count === 0) && (
            <p className="text-base text-gray-500">No deals yet.</p>
          )}
        </div>
      </div>

      {/* Fleet by type + utilization bars */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-x-auto">
        <h3 className="text-base font-bold text-gray-900 mb-3">
          Fleet by Type <span className="font-normal text-sm text-gray-500">(live from Fleet Master)</span>
        </h3>
        <table className="w-full text-base min-w-[640px]">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="py-1.5 pr-2 font-semibold">Type</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Total</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Rented</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Available</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Maint.</th>
              <th className="py-1.5 pr-2 font-semibold">Utilization</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Avg Idle</th>
              <th className="py-1.5 font-semibold text-right">Max Idle</th>
            </tr>
          </thead>
          <tbody>
            {data.fleetByType
              .filter((t) => t.total > 0)
              .map((t) => (
                <tr key={t.trailerType} className="border-b last:border-0">
                  <td className="py-1.5 pr-2 text-gray-900 font-medium">{crmTrailerLabel(t.trailerType)}</td>
                  <td className="py-1.5 pr-2 text-right">{t.total}</td>
                  <td className="py-1.5 pr-2 text-right text-emerald-700 font-semibold">{t.rented}</td>
                  <td className="py-1.5 pr-2 text-right">{t.available}</td>
                  <td className="py-1.5 pr-2 text-right">{t.maintenance}</td>
                  <td className="py-1.5 pr-2 w-48">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-orange rounded-full"
                          style={{ width: `${t.utilization}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-10 text-right">{t.utilization.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="py-1.5 pr-2 text-right">{t.avgIdleDays.toFixed(0)}d</td>
                  <td className="py-1.5 text-right">{t.maxIdleDays}d</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Lost monthly revenue */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-base font-bold text-gray-900 mb-1">Lost Monthly Revenue</h3>
          <p className="text-sm text-gray-500 mb-3">
            Non-rented units × avg monthly rate per type — estimated{' '}
            <span className="font-semibold text-rose-600">{formatCurrency(kpis.lostMonthlyTotal)}/mo</span>
          </p>
          <table className="w-full text-base">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="py-1.5 pr-2 font-semibold">Type</th>
                <th className="py-1.5 pr-2 font-semibold text-right">Units</th>
                <th className="py-1.5 pr-2 font-semibold text-right">Avg Rate</th>
                <th className="py-1.5 font-semibold text-right">Lost / mo</th>
              </tr>
            </thead>
            <tbody>
              {data.lostMonthlyByType
                .filter((t) => t.units > 0)
                .map((t) => (
                  <tr key={t.trailerType} className="border-b last:border-0">
                    <td className="py-1.5 pr-2 text-gray-900">{crmTrailerLabel(t.trailerType)}</td>
                    <td className="py-1.5 pr-2 text-right">{t.units}</td>
                    <td className="py-1.5 pr-2 text-right">{formatCurrency(t.avgMonthlyRate)}</td>
                    <td className="py-1.5 text-right font-semibold text-rose-600">
                      {formatCurrency(t.lostMonthly)}
                    </td>
                  </tr>
                ))}
              {data.lostMonthlyByType.every((t) => t.units === 0) && (
                <tr>
                  <td colSpan={4} className="py-2 text-base text-gray-500">
                    Every unit is earning — nothing idle.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Idle loss in range */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <h3 className="text-base font-bold text-gray-900">Idle Revenue Loss</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={idleFrom}
                onChange={(e) => setIdleFrom(e.target.value)}
                className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
              />
              <span className="text-sm text-gray-400">→</span>
              <input
                type="date"
                value={idleTo}
                onChange={(e) => setIdleTo(e.target.value)}
                className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
              />
              <button
                onClick={() => load(idleFrom || undefined, idleTo || undefined)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange/90"
              >
                <RotateCw className="w-3.5 h-3.5" /> Apply
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            {kpis.idleRangeFrom} → {kpis.idleRangeTo} (default YTD) — estimated{' '}
            <span className="font-semibold text-rose-600">{formatCurrency(kpis.idleLossInRange)}</span> ·{' '}
            {kpis.cumulativeIdleDays.toLocaleString()} cumulative idle days
          </p>
          <table className="w-full text-base">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="py-1.5 pr-2 font-semibold">Type</th>
                <th className="py-1.5 pr-2 font-semibold text-right">Units</th>
                <th className="py-1.5 pr-2 font-semibold text-right">Idle Days</th>
                <th className="py-1.5 font-semibold text-right">Lost</th>
              </tr>
            </thead>
            <tbody>
              {data.idleLossByType
                .filter((t) => t.units > 0)
                .map((t) => (
                  <tr key={t.trailerType} className="border-b last:border-0">
                    <td className="py-1.5 pr-2 text-gray-900">{crmTrailerLabel(t.trailerType)}</td>
                    <td className="py-1.5 pr-2 text-right">{t.units}</td>
                    <td className="py-1.5 pr-2 text-right">{t.days.toLocaleString()}</td>
                    <td className="py-1.5 text-right font-semibold text-rose-600">{formatCurrency(t.lost)}</td>
                  </tr>
                ))}
              {data.idleLossByType.every((t) => t.units === 0) && (
                <tr>
                  <td colSpan={4} className="py-2 text-base text-gray-500">
                    No idle units in this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rental velocity */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-x-auto">
        <h3 className="text-base font-bold text-gray-900 mb-1">Rental Velocity</h3>
        <p className="text-sm text-gray-500 mb-3">
          Estimated from rental start dates of currently rented units, trailing {data.velocity.months} months:{' '}
          {data.velocity.totalRecent} rentals started · {data.velocity.avgPerMonth.toFixed(1)}/mo avg ·{' '}
          {data.velocity.monthsToLeaseAll !== null
            ? `~${data.velocity.monthsToLeaseAll.toFixed(1)} months to lease all available units`
            : 'no recent rentals to forecast time-to-lease'}
        </p>
        <table className="w-full text-base min-w-[560px]">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="py-1.5 pr-2 font-semibold">Type</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Started ({data.velocity.months} mo)</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Avg / mo</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Available</th>
              <th className="py-1.5 font-semibold text-right">Months to Lease All</th>
            </tr>
          </thead>
          <tbody>
            {data.velocity.byType
              .filter((t) => t.available > 0 || t.rentedInPeriod > 0)
              .map((t) => (
                <tr key={t.trailerType} className="border-b last:border-0">
                  <td className="py-1.5 pr-2 text-gray-900">{crmTrailerLabel(t.trailerType)}</td>
                  <td className="py-1.5 pr-2 text-right">{t.rentedInPeriod}</td>
                  <td className="py-1.5 pr-2 text-right">{t.avgPerMonth.toFixed(1)}</td>
                  <td className="py-1.5 pr-2 text-right">{t.available}</td>
                  <td className="py-1.5 text-right">
                    {t.monthsToLeaseAll !== null ? `~${t.monthsToLeaseAll.toFixed(1)} mo` : '—'}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {error && <p className="text-base text-red-600">{error}</p>}
    </div>
  )
}
