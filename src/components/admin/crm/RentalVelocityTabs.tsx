'use client'

import { useState } from 'react'
import { crmTrailerLabel } from '@/lib/crm'
import RentalsVsAvailableChart, { type RentalPoint } from './RentalsVsAvailableChart'

export interface VelocityTypeRow {
  trailerType: string
  rentedInPeriod: number
  avgPerMonth: number
  available: number
  monthsToLeaseAll: number | null
}

interface Props {
  points: RentalPoint[]
  capacityUnits: number
  capacityRevenue: number
  rented: number
  available: number
  velocityByType: VelocityTypeRow[]
}

const TABS = [
  { id: 'chart', label: '12-Month Rentals vs Available' },
  { id: 'kpis', label: 'Summary KPIs' },
  { id: 'byType', label: 'By Trailer Type' },
] as const

type TabId = (typeof TABS)[number]['id']

function fmtMonths(v: number | null): string {
  return v !== null ? `~${v.toFixed(1)}` : 'N/A'
}

function MiniKpi({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-sm text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

// Tabbed container for the rental-velocity / time-to-lease view (Bruno 2026-06-26).
// All numbers are derived from the dashboard payload; nothing new is fetched.
export default function RentalVelocityTabs({
  points,
  capacityUnits,
  capacityRevenue,
  rented,
  available,
  velocityByType,
}: Props) {
  const [tab, setTab] = useState<TabId>('chart')

  // AVG RENTALS / MONTH = average of the per-month rental totals shown in the chart.
  const avgRentalsPerMonth = points.length
    ? points.reduce((s, p) => s + p.rentedUnits, 0) / points.length
    : 0
  // MONTHS TO LEASE ENTIRE FLEET = currently available ÷ avg rentals per month.
  const monthsToLeaseFleet = avgRentalsPerMonth > 0 ? available / avgRentalsPerMonth : null

  const velTotals = velocityByType.reduce(
    (acc, t) => ({
      rentedInPeriod: acc.rentedInPeriod + t.rentedInPeriod,
      avgPerMonth: acc.avgPerMonth + t.avgPerMonth,
      available: acc.available + t.available,
    }),
    { rentedInPeriod: 0, avgPerMonth: 0, available: 0 }
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-gray-200 px-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap px-3 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-brand-orange text-brand-orange'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Tab 1: chart */}
        {tab === 'chart' && (
          <div>
            <p className="text-sm text-gray-500 mb-3">
              Units rented per month vs total available capacity (trailing 12 months).
            </p>
            <RentalsVsAvailableChart
              points={points}
              capacityUnits={capacityUnits}
              capacityRevenue={capacityRevenue}
            />
          </div>
        )}

        {/* Tab 2: summary KPIs */}
        {tab === 'kpis' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MiniKpi
              label="Avg Rentals / Month"
              value={avgRentalsPerMonth.toFixed(1)}
              sub="Avg of monthly rental totals"
            />
            <MiniKpi label="Trailers Rented in Period" value={rented} sub="Status = Rented" />
            <MiniKpi label="Currently Available" value={available} sub="Status = Available" />
            <MiniKpi label="Months to Lease Entire Fleet" value={fmtMonths(monthsToLeaseFleet)} />
          </div>
        )}

        {/* Tab 3: by trailer type */}
        {tab === 'byType' && (
          <div className="overflow-x-auto">
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
                {velocityByType.map((t) => (
                  <tr key={t.trailerType} className="border-b last:border-0">
                    <td className="py-1.5 pr-2 text-gray-900">{crmTrailerLabel(t.trailerType)}</td>
                    <td className="py-1.5 pr-2 text-right">{t.rentedInPeriod}</td>
                    <td className="py-1.5 pr-2 text-right">{t.avgPerMonth.toFixed(1)}</td>
                    <td className="py-1.5 pr-2 text-right">{t.available}</td>
                    <td className="py-1.5 text-right">{fmtMonths(t.monthsToLeaseAll)}</td>
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
        )}
      </div>
    </div>
  )
}
