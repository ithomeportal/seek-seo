'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ExternalLink, Loader2, Mail } from 'lucide-react'
import { crmTrailerLabel, followupSection, humanCountdown } from '@/lib/crm'
import RentalsVsAvailableChart, { type RentalPoint } from './RentalsVsAvailableChart'
import { crmFetch, formatCurrency, formatDateTime, type AlertItem, type CrmRep } from './types'

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
    totalLeads: number
    lostMonthlyTotal: number
  }
  lostMonthlyByType: Array<{
    trailerType: string
    units: number
    avgMonthlyRate: number
    lostMonthly: number
  }>
  fleetByType: Array<{
    trailerType: string
    total: number
    available: number
    rented: number
    maintenance: number
    utilization: number
    avgIdleDays: number
    maxIdleDays: number
  }>
  pipeline: {
    byStage: Array<{ stage: string; count: number; monthlyRevenue: number }>
    byRegion: Array<{ region: string; count: number; monthlyRevenue: number }>
    byTrailerType: Array<{ trailerType: string; count: number; units: number; monthlyRevenue: number }>
    leadFunnel: Array<{ status: string; count: number }>
    leadToQualified: number
    leadToWon: number
  }
  dealsByStage: Array<{ stage: string; probability: number; count: number }>
  rentalsVsAvailable: {
    capacityUnits: number
    blendedRate: number
    capacityRevenue: number
    points: RentalPoint[]
  }
}

const FUNNEL_TONES: Record<string, string> = {
  New: 'bg-sky-50 text-sky-900 border-sky-200',
  Contacted: 'bg-indigo-50 text-indigo-900 border-indigo-200',
  Qualified: 'bg-violet-50 text-violet-900 border-violet-200',
  'Proposal Sent': 'bg-amber-50 text-amber-900 border-amber-200',
  Won: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  Lost: 'bg-rose-50 text-rose-900 border-rose-200',
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mt-2">{children}</h2>
  )
}

function KpiCard({
  label,
  value,
  sub,
  valueClass = 'text-gray-900',
  children,
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  valueClass?: string
  children?: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${valueClass}`}>{value}</p>
      {sub && <p className="text-sm text-gray-500 mt-1">{sub}</p>}
      {children}
    </div>
  )
}

export default function CrmDashboardTab() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [reps, setReps] = useState<CrmRep[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [owner, setOwner] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (ownerFilter: string) => {
    setLoading(true)
    setError('')
    try {
      const alertParams = ownerFilter !== 'all' ? `?owner=${encodeURIComponent(ownerFilter)}` : ''
      const [d, repsData, alertData] = await Promise.all([
        crmFetch<DashboardData>('/api/admin/crm/analytics/dashboard'),
        crmFetch<CrmRep[]>('/api/admin/crm/reps'),
        crmFetch<{ items: AlertItem[] }>(`/api/admin/crm/activities/alert-center${alertParams}`),
      ])
      setData(d)
      setReps(repsData)
      setAlerts(alertData.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(owner)
  }, [load, owner])

  const overdue = useMemo(() => {
    const now = new Date()
    return alerts
      .filter((a) => a.followUpAt && followupSection(new Date(a.followUpAt), now) === 'overdue')
      .sort((a, b) => new Date(a.followUpAt ?? 0).getTime() - new Date(b.followUpAt ?? 0).getTime())
  }, [alerts])

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

  const { kpis, pipeline, dealsByStage, rentalsVsAvailable } = data
  const funnelTotal = pipeline.leadFunnel.reduce((s, x) => s + x.count, 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Sales pipeline, fleet utilization, and rental velocity at a glance.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Follow-ups for</span>
          <select
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-base"
          >
            <option value="all">All reps</option>
            {reps.map((r) => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Follow-up Alert Center */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 text-gray-500">
              <Mail className="w-4 h-4" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Follow-up Alert Center</p>
              <p className="text-base font-bold text-gray-900">
                Follow-ups <span className="font-normal text-gray-500">{alerts.length} open</span>
                {overdue.length > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold uppercase">
                    {overdue.length} overdue
                  </span>
                )}
              </p>
            </div>
          </div>
          <a
            href="/admin/dashboard?tab=crm_followups"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Expand in new tab
          </a>
        </div>
        {overdue.length === 0 ? (
          <p className="text-base text-gray-500">No overdue follow-ups — nicely done.</p>
        ) : (
          <div>
            <p className="flex items-center gap-1.5 text-sm font-bold text-rose-600 mb-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Overdue ({overdue.length})
            </p>
            <ul className="space-y-1.5">
              {overdue.map((item) => (
                <li
                  key={item.id}
                  className="border-l-4 border-rose-400 bg-rose-50/50 rounded-r-lg px-3 py-2 flex items-center justify-between flex-wrap gap-2"
                >
                  <div className="min-w-0">
                    <span className="text-sm text-gray-700">{formatDateTime(item.followUpAt)}</span>
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-xs font-bold uppercase">
                      {item.followUpAt ? humanCountdown(new Date(item.followUpAt)) : 'Overdue'}
                    </span>
                    <span className="ml-2 font-semibold text-gray-900">{item.companyName || '—'}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      {item.activityType}
                      {item.notes ? ` · “${item.notes.slice(0, 60)}${item.notes.length > 60 ? '…' : ''}”` : ''}
                    </span>
                  </div>
                  <div className="text-right text-sm text-gray-500 shrink-0">
                    <span className="font-semibold text-gray-700">{formatCurrency(item.monthlyValue)}/mo</span>
                    {item.assignedTo ? <span className="ml-2">{item.assignedTo}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Lead Funnel (unchanged) */}
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

      {/* ===== PIPELINE & SALES ===== */}
      <SectionLabel>Pipeline &amp; Sales</SectionLabel>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Open Deals"
          value={kpis.openDeals}
          sub={`${kpis.wonDeals} won · ${kpis.lostDeals} lost`}
        />
        <KpiCard
          label="Pipeline Monthly"
          value={formatCurrency(kpis.pipelineMonthly)}
          valueClass="text-emerald-600"
          sub="Total potential MRR"
        />
        <KpiCard
          label="Won Contract Value"
          value={formatCurrency(kpis.wonContractValue)}
          sub="Lifetime closed-won"
        />
        <KpiCard
          label="Win Rate"
          value={`${kpis.winRate.toFixed(1)}%`}
          sub={`${kpis.totalLeads} total leads`}
        />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-base font-bold text-gray-900 mb-3">Stage Probability</h3>
        <table className="w-full text-base">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="py-1.5 pr-2 font-semibold">Stage</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Prob.</th>
              <th className="py-1.5 font-semibold text-right">Deals</th>
            </tr>
          </thead>
          <tbody>
            {dealsByStage.map((row) => (
              <tr key={row.stage} className="border-b last:border-0">
                <td className="py-1.5 pr-2 text-gray-900">{row.stage}</td>
                <td className="py-1.5 pr-2 text-right text-gray-600">{row.probability}%</td>
                <td className="py-1.5 text-right font-semibold text-gray-900">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== FLEET UTILIZATION & IDLE COST ===== */}
      <SectionLabel>Fleet Utilization &amp; Idle Cost</SectionLabel>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total Trailers" value={kpis.totalTrailers} />
        <KpiCard
          label="Rented"
          value={kpis.rented}
          valueClass="text-emerald-600"
          sub={`${kpis.utilization.toFixed(1)}% utilization`}
        />
        <KpiCard
          label="Available (Sitting)"
          value={kpis.available}
          valueClass="text-amber-600"
          sub={`${kpis.cumulativeIdleDays.toLocaleString()} cumulative idle days`}
        />
        <KpiCard label="Lost Revenue / Month" value={formatCurrency(kpis.lostMonthlyTotal)} valueClass="text-rose-600">
          <div className="mt-2 space-y-0.5">
            <p className="text-xs text-gray-400">Available + Maintenance × avg monthly rate</p>
            {data.lostMonthlyByType
              .filter((t) => t.units > 0)
              .map((t) => (
                <div key={t.trailerType} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {crmTrailerLabel(t.trailerType)} ({t.units})
                  </span>
                  <span className="font-semibold text-rose-600">{formatCurrency(t.lostMonthly)}</span>
                </div>
              ))}
          </div>
        </KpiCard>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-x-auto">
        <h3 className="text-base font-bold text-gray-900 mb-3">Fleet Details by Trailer Type</h3>
        <table className="w-full text-base min-w-[640px]">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="py-1.5 pr-2 font-semibold">Type</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Total</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Available</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Rented</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Maintenance</th>
              <th className="py-1.5 pr-2 font-semibold">Utilization</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Avg Idle Days</th>
              <th className="py-1.5 font-semibold text-right">Max Idle Days</th>
            </tr>
          </thead>
          <tbody>
            {data.fleetByType
              .filter((t) => t.total > 0)
              .map((t) => (
                <tr key={t.trailerType} className="border-b last:border-0">
                  <td className="py-1.5 pr-2 text-gray-900 font-medium">{crmTrailerLabel(t.trailerType)}</td>
                  <td className="py-1.5 pr-2 text-right">{t.total}</td>
                  <td className="py-1.5 pr-2 text-right">{t.available}</td>
                  <td className="py-1.5 pr-2 text-right text-emerald-700 font-semibold">{t.rented}</td>
                  <td className="py-1.5 pr-2 text-right">{t.maintenance}</td>
                  <td className="py-1.5 pr-2 w-48">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-orange rounded-full" style={{ width: `${t.utilization}%` }} />
                      </div>
                      <span className="text-sm text-gray-600 w-10 text-right">{t.utilization.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="py-1.5 pr-2 text-right">{t.avgIdleDays.toFixed(0)}</td>
                  <td className="py-1.5 text-right">{t.maxIdleDays}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* ===== RENTAL VELOCITY & TIME-TO-LEASE FORECAST ===== */}
      <SectionLabel>Rental Velocity &amp; Time-to-Lease Forecast</SectionLabel>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-base font-bold text-gray-900 mb-1">12-Month Rentals vs Available</h3>
        <p className="text-sm text-gray-500 mb-3">Units rented per month vs total available capacity (trailing 12 months).</p>
        <RentalsVsAvailableChart
          points={rentalsVsAvailable.points}
          capacityUnits={rentalsVsAvailable.capacityUnits}
          capacityRevenue={rentalsVsAvailable.capacityRevenue}
        />
      </div>

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
              {pipeline.byStage.map((r) => (
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
          {pipeline.byRegion.length === 0 ? (
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
                {pipeline.byRegion.map((r) => (
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
              {pipeline.byTrailerType.map((t) => (
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

      {error && <p className="text-base text-red-600">{error}</p>}
    </div>
  )
}
