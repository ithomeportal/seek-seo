'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { crmTrailerLabel } from '@/lib/crm'
import { formatCurrency } from './types'

export interface CustomDateKpi {
  key: string
  months: number
  lostLabel: string
  avgLabel: string
  rangeFrom: string
  rangeTo: string
  lostRevenue: {
    total: number
    byType: Array<{ trailerType: string; units: number; days: number; lost: number }>
  }
  avgTrailerRented: {
    totalRented: number
    avgPerMonth: number
    byType: Array<{ trailerType: string; rentedInPeriod: number; avgPerMonth: number }>
  }
}

// Dropdown labels for the shared "Custom Date" filter (Bruno 2026-06-29).
const WINDOW_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'm1', label: 'Last 1 Month' },
  { key: 'm3', label: 'Last 3 Months' },
  { key: 'ytd', label: 'Year-to-date (YTD)' },
  { key: 'm12', label: 'Last 12 Months' },
]

// "2026-06-01" -> "06/01/2026"
function mmddyyyy(iso: string): string {
  const [y, m, d] = iso.split('-')
  return y && m && d ? `${m}/${d}/${y}` : iso
}

function DateDropdown({
  value,
  onChange,
}: {
  value: string
  onChange: (key: string) => void
}) {
  return (
    <label className="relative flex items-center w-full">
      <Calendar className="absolute left-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-gray-300 bg-white pl-8 pr-3 py-1.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-orange/50 focus:border-brand-orange"
      >
        {WINDOW_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

// Two windowed KPI cards driven by an independent "Custom Date" dropdown each.
// All windows are precomputed server-side, so switching is instant (no re-fetch).
export default function CrmCustomDateKpis({
  customDateKpis,
}: {
  customDateKpis: CustomDateKpi[]
}) {
  const [lostKey, setLostKey] = useState('ytd')
  const [rentedKey, setRentedKey] = useState('ytd')

  const lost = customDateKpis.find((w) => w.key === lostKey) ?? customDateKpis[0]
  const rented = customDateKpis.find((w) => w.key === rentedKey) ?? customDateKpis[0]
  if (!lost || !rented) return null

  const lostTypes = lost.lostRevenue.byType.filter((t) => t.units > 0)
  const rentedTypes = rented.avgTrailerRented.byType.filter((t) => t.rentedInPeriod > 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Lost Revenue (custom date) */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {lost.lostLabel} LOST REVENUE
        </p>
        <div className="mt-2">
          <DateDropdown value={lostKey} onChange={setLostKey} />
        </div>
        <p className="text-2xl font-bold mt-2 text-rose-600">
          {formatCurrency(lost.lostRevenue.total)}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {mmddyyyy(lost.rangeFrom)} → {mmddyyyy(lost.rangeTo)}
        </p>
        <div className="mt-2 space-y-0.5">
          {lostTypes.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No idle revenue in this period.</p>
          ) : (
            lostTypes.map((t) => (
              <div key={t.trailerType} className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  {crmTrailerLabel(t.trailerType)} ({t.days}d)
                </span>
                <span className="font-semibold text-rose-600">{formatCurrency(t.lost)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Avg Trailer Rented (custom date) */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          AVG TRAILER RENTED {rented.avgLabel}
        </p>
        <div className="mt-2">
          <DateDropdown value={rentedKey} onChange={setRentedKey} />
        </div>
        <p className="text-2xl font-bold mt-2 text-gray-900">
          {rented.avgTrailerRented.avgPerMonth.toFixed(1)}
          <span className="text-base font-semibold text-gray-400">/mo</span>
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {mmddyyyy(rented.rangeFrom)} → {mmddyyyy(rented.rangeTo)} ·{' '}
          {rented.avgTrailerRented.totalRented} rented
        </p>
        <div className="mt-2 space-y-0.5">
          {rentedTypes.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No rentals in this period.</p>
          ) : (
            rentedTypes.map((t) => (
              <div key={t.trailerType} className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  {crmTrailerLabel(t.trailerType)} ({t.avgPerMonth.toFixed(1)}/mo)
                </span>
                <span className="font-semibold text-gray-900">{t.rentedInPeriod}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
