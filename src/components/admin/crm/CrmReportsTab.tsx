'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { crmTrailerLabel } from '@/lib/crm'
import { crmFetch, formatCurrency, formatDate } from './types'

interface RepPerformance {
  rep: string
  leads: number
  openDeals: number
  wonDeals: number
  lostDeals: number
  winRate: number
  openPipeline: number
  weightedPipeline: number
  wonContractValue: number
  activities: number
  pending: number
  overdue: number
}

interface PipelineHealthRow {
  rep: string
  total: number
  Advancing: number
  Steady: number
  Stalling: number
  Cold: number
  'No Activity': number
}

interface CancelledDeals {
  totalCount: number
  totalLostMRR: number
  totalLostTCV: number
  byLead: Array<{
    leadId: number
    companyName: string
    count: number
    lostMRR: number
    lostTCV: number
    deals: Array<{
      id: number
      trailerType: string
      quantity: number
      monthlyRatePerUnit: number
      rentalTermMonths: number
      cancelledAt: string | null
      reason: string | null
    }>
  }>
  byCustomer: Array<{ companyName: string; count: number; lostMRR: number; lostTCV: number }>
}

interface ReportsData {
  repPerformance: RepPerformance[]
  pipelineHealth: PipelineHealthRow[]
  cancelledDeals: CancelledDeals
}

interface DashData {
  pipeline: {
    byStage: Array<{ stage: string; count: number; monthlyRevenue: number }>
    byRegion: Array<{ region: string; count: number; monthlyRevenue: number }>
    byTrailerType: Array<{ trailerType: string; count: number; units: number; monthlyRevenue: number }>
    leadFunnel: Array<{ status: string; count: number }>
    leadToQualified: number
    leadToWon: number
  }
  velocity: {
    months: number
    byType: Array<{
      trailerType: string
      rentedInPeriod: number
      avgPerMonth: number
      available: number
      monthsToLeaseAll: number | null
    }>
  }
}

export default function CrmReportsTab() {
  const [data, setData] = useState<ReportsData | null>(null)
  const [dash, setDash] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lostView, setLostView] = useState<'byLead' | 'byCustomer'>('byLead')
  const [lookback, setLookback] = useState(6)

  const load = useCallback(async (months: number) => {
    setLoading(true)
    setError('')
    try {
      const [reportsData, dashData] = await Promise.all([
        crmFetch<ReportsData>('/api/admin/crm/analytics/reports'),
        crmFetch<DashData>(`/api/admin/crm/analytics/dashboard?velocityMonths=${months}`),
      ])
      setData(reportsData)
      setDash(dashData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(lookback)
  }, [load, lookback])

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading reports…
      </div>
    )
  }
  if (error && !data) return <div className="p-6 text-base text-red-600">{error}</div>
  if (!data) return null

  const funnel = dash?.pipeline.leadFunnel ?? []
  const velTotals = (dash?.velocity.byType ?? []).reduce(
    (acc, t) => ({
      rentedInPeriod: acc.rentedInPeriod + t.rentedInPeriod,
      avgPerMonth: acc.avgPerMonth + t.avgPerMonth,
      available: acc.available + t.available,
    }),
    { rentedInPeriod: 0, avgPerMonth: 0, available: 0 }
  )

  return (
    <div className="space-y-6">
      {/* 1. Pipeline Health by Owner */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-x-auto">
        <h3 className="text-base font-bold text-gray-900 mb-1">Pipeline Health by Owner</h3>
        <p className="text-sm text-gray-500 mb-3">
          Open leads + deals classified by recent activity: Advancing / Steady / Stalling / Cold / No Activity.
        </p>
        <table className="w-full text-base min-w-[640px]">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="py-1.5 pr-2 font-semibold">Owner</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Total</th>
              <th className="py-1.5 pr-2 font-semibold text-right text-emerald-700">Advancing</th>
              <th className="py-1.5 pr-2 font-semibold text-right text-sky-700">Steady</th>
              <th className="py-1.5 pr-2 font-semibold text-right text-amber-700">Stalling</th>
              <th className="py-1.5 pr-2 font-semibold text-right text-rose-600">Cold</th>
              <th className="py-1.5 font-semibold text-right text-gray-500">No Activity</th>
            </tr>
          </thead>
          <tbody>
            {data.pipelineHealth.map((r) => (
              <tr key={r.rep} className="border-b last:border-0">
                <td className="py-1.5 pr-2 font-semibold text-gray-900">{r.rep}</td>
                <td className="py-1.5 pr-2 text-right">{r.total}</td>
                <td className="py-1.5 pr-2 text-right">{r.Advancing}</td>
                <td className="py-1.5 pr-2 text-right">{r.Steady}</td>
                <td className="py-1.5 pr-2 text-right">{r.Stalling}</td>
                <td className="py-1.5 pr-2 text-right">{r.Cold}</td>
                <td className="py-1.5 text-right">{r['No Activity']}</td>
              </tr>
            ))}
            {data.pipelineHealth.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-gray-500 text-base">No data yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 2. Sales Rep Performance */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-x-auto">
        <h3 className="text-base font-bold text-gray-900 mb-3">Sales Rep Performance</h3>
        <table className="w-full text-base min-w-[900px]">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="py-1.5 pr-2 font-semibold">Rep</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Leads</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Open</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Won</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Lost</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Win %</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Open Pipeline (Mo.)</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Weighted (Mo.)</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Won Contract Value</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Activities</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Pending</th>
              <th className="py-1.5 font-semibold text-right">Overdue</th>
            </tr>
          </thead>
          <tbody>
            {data.repPerformance.map((r) => (
              <tr key={r.rep} className="border-b last:border-0">
                <td className="py-1.5 pr-2 font-semibold text-gray-900">{r.rep}</td>
                <td className="py-1.5 pr-2 text-right">{r.leads}</td>
                <td className="py-1.5 pr-2 text-right">{r.openDeals}</td>
                <td className="py-1.5 pr-2 text-right text-emerald-700 font-semibold">{r.wonDeals}</td>
                <td className="py-1.5 pr-2 text-right text-rose-600">{r.lostDeals}</td>
                <td className="py-1.5 pr-2 text-right">{r.winRate.toFixed(1)}%</td>
                <td className="py-1.5 pr-2 text-right">{formatCurrency(r.openPipeline)}</td>
                <td className="py-1.5 pr-2 text-right">{formatCurrency(r.weightedPipeline)}</td>
                <td className="py-1.5 pr-2 text-right font-semibold">{formatCurrency(r.wonContractValue)}</td>
                <td className="py-1.5 pr-2 text-right">{r.activities}</td>
                <td className="py-1.5 pr-2 text-right">{r.pending}</td>
                <td className={`py-1.5 text-right ${r.overdue > 0 ? 'text-rose-600 font-bold' : ''}`}>{r.overdue}</td>
              </tr>
            ))}
            {data.repPerformance.length === 0 && (
              <tr>
                <td colSpan={12} className="py-6 text-center text-gray-500 text-base">No rep data yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Pipeline by Stage / Region / Trailer Type */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-base font-bold text-gray-900 mb-3">Pipeline by Stage</h3>
          <table className="w-full text-base">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="py-1.5 pr-2 font-semibold">Stage</th>
                <th className="py-1.5 pr-2 font-semibold text-right">Deals</th>
                <th className="py-1.5 font-semibold text-right">Monthly</th>
              </tr>
            </thead>
            <tbody>
              {(dash?.pipeline.byStage ?? []).map((r) => (
                <tr key={r.stage} className="border-b last:border-0">
                  <td className="py-1.5 pr-2 text-gray-900">{r.stage}</td>
                  <td className="py-1.5 pr-2 text-right">{r.count}</td>
                  <td className="py-1.5 text-right text-gray-700">{formatCurrency(r.monthlyRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-base font-bold text-gray-900 mb-3">Pipeline by Region</h3>
          {(dash?.pipeline.byRegion ?? []).length === 0 ? (
            <p className="text-base text-gray-500">No deals with a region yet.</p>
          ) : (
            <table className="w-full text-base">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="py-1.5 pr-2 font-semibold">Region</th>
                  <th className="py-1.5 pr-2 font-semibold text-right">Deals</th>
                  <th className="py-1.5 font-semibold text-right">Monthly</th>
                </tr>
              </thead>
              <tbody>
                {(dash?.pipeline.byRegion ?? []).map((r) => (
                  <tr key={r.region} className="border-b last:border-0">
                    <td className="py-1.5 pr-2 text-gray-900">{r.region}</td>
                    <td className="py-1.5 pr-2 text-right">{r.count}</td>
                    <td className="py-1.5 text-right text-gray-700">{formatCurrency(r.monthlyRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-base font-bold text-gray-900 mb-3">Pipeline by Trailer Type</h3>
          <table className="w-full text-base">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="py-1.5 pr-2 font-semibold">Type</th>
                <th className="py-1.5 pr-2 font-semibold text-right">Deals</th>
                <th className="py-1.5 pr-2 font-semibold text-right">Units</th>
                <th className="py-1.5 font-semibold text-right">Monthly</th>
              </tr>
            </thead>
            <tbody>
              {(dash?.pipeline.byTrailerType ?? []).map((t) => (
                <tr key={t.trailerType} className="border-b last:border-0">
                  <td className="py-1.5 pr-2 text-gray-900">{crmTrailerLabel(t.trailerType)}</td>
                  <td className="py-1.5 pr-2 text-right">{t.count}</td>
                  <td className="py-1.5 pr-2 text-right">{t.units}</td>
                  <td className="py-1.5 text-right text-gray-700">{formatCurrency(t.monthlyRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Lead Funnel */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-base font-bold text-gray-900">Lead Funnel</h3>
          {dash && (
            <p className="text-sm text-gray-500">
              Lead→Qualified {dash.pipeline.leadToQualified.toFixed(1)}% · Lead→Won{' '}
              {dash.pipeline.leadToWon.toFixed(1)}%
            </p>
          )}
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {funnel.map((cell) => (
            <div key={cell.status} className="rounded-lg border border-gray-200 p-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{cell.status}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{cell.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Rental Velocity & Time-to-Lease Forecast */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-x-auto">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <h3 className="text-base font-bold text-gray-900">Rental Velocity &amp; Time-to-Lease Forecast</h3>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Lookback (months)</span>
            <input
              type="number"
              min={1}
              max={24}
              value={lookback}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                if (Number.isFinite(v)) setLookback(Math.min(24, Math.max(1, v)))
              }}
              className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-base"
            />
          </label>
        </div>
        <table className="w-full text-base min-w-[640px]">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="py-1.5 pr-2 font-semibold">Type</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Rented in Period</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Avg / Month</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Currently Available</th>
              <th className="py-1.5 font-semibold text-right">Months to Lease All</th>
            </tr>
          </thead>
          <tbody>
            {(dash?.velocity.byType ?? []).map((t) => (
              <tr key={t.trailerType} className="border-b last:border-0">
                <td className="py-1.5 pr-2 text-gray-900">{crmTrailerLabel(t.trailerType)}</td>
                <td className="py-1.5 pr-2 text-right">{t.rentedInPeriod}</td>
                <td className="py-1.5 pr-2 text-right">{t.avgPerMonth.toFixed(1)}</td>
                <td className="py-1.5 pr-2 text-right">{t.available}</td>
                <td className="py-1.5 text-right">
                  {t.monthsToLeaseAll !== null ? `~${t.monthsToLeaseAll.toFixed(1)}` : 'N/A'}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-gray-200 font-bold text-gray-900">
              <td className="py-1.5 pr-2">Total</td>
              <td className="py-1.5 pr-2 text-right">{velTotals.rentedInPeriod}</td>
              <td className="py-1.5 pr-2 text-right">{velTotals.avgPerMonth.toFixed(1)}</td>
              <td className="py-1.5 pr-2 text-right">{velTotals.available}</td>
              <td className="py-1.5 text-right">N/A</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 6. Cancelled / Lost Deals */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-gray-900">Cancelled / Lost Deals</h3>
            <p className="text-sm text-gray-500">
              {data.cancelledDeals.totalCount} deals · {formatCurrency(data.cancelledDeals.totalLostMRR)}/mo ·
              TCV {formatCurrency(data.cancelledDeals.totalLostTCV)}
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setLostView('byLead')}
              className={`px-3 py-1.5 text-sm font-semibold ${lostView === 'byLead' ? 'bg-brand-orange text-white' : 'bg-white text-gray-700'}`}
            >
              By Lead
            </button>
            <button
              onClick={() => setLostView('byCustomer')}
              className={`px-3 py-1.5 text-sm font-semibold ${lostView === 'byCustomer' ? 'bg-brand-orange text-white' : 'bg-white text-gray-700'}`}
            >
              By Customer
            </button>
          </div>
        </div>

        {lostView === 'byLead' ? (
          data.cancelledDeals.byLead.length === 0 ? (
            <p className="text-base text-gray-500">No lost deals — great.</p>
          ) : (
            <div className="space-y-3">
              {data.cancelledDeals.byLead.map((g) => (
                <div key={g.leadId} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <p className="text-base font-semibold text-gray-900">{g.companyName}</p>
                    <p className="text-sm text-gray-500">
                      {g.count} deal{g.count === 1 ? '' : 's'} · {formatCurrency(g.lostMRR)}/mo · TCV{' '}
                      <span className="font-semibold text-rose-600">{formatCurrency(g.lostTCV)}</span>
                    </p>
                  </div>
                  <ul className="mt-1.5 space-y-1">
                    {g.deals.map((d) => (
                      <li key={d.id} className="text-sm text-gray-600">
                        {crmTrailerLabel(d.trailerType)} × {d.quantity} @ {formatCurrency(d.monthlyRatePerUnit)}/mo ·{' '}
                        {d.rentalTermMonths} mo · cancelled {formatDate(d.cancelledAt)}
                        {d.reason && <span className="italic"> — “{d.reason}”</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )
        ) : data.cancelledDeals.byCustomer.length === 0 ? (
          <p className="text-base text-gray-500">No lost deals — great.</p>
        ) : (
          <table className="w-full text-base">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="py-1.5 pr-2 font-semibold">Customer</th>
                <th className="py-1.5 pr-2 font-semibold text-right">Lost Deals</th>
                <th className="py-1.5 pr-2 font-semibold text-right">Lost MRR</th>
                <th className="py-1.5 font-semibold text-right">Lost TCV</th>
              </tr>
            </thead>
            <tbody>
              {data.cancelledDeals.byCustomer.map((c) => (
                <tr key={c.companyName} className="border-b last:border-0">
                  <td className="py-1.5 pr-2 font-semibold text-gray-900">{c.companyName}</td>
                  <td className="py-1.5 pr-2 text-right">{c.count}</td>
                  <td className="py-1.5 pr-2 text-right">{formatCurrency(c.lostMRR)}</td>
                  <td className="py-1.5 text-right font-semibold text-rose-600">{formatCurrency(c.lostTCV)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {error && <p className="text-base text-red-600">{error}</p>}
    </div>
  )
}
