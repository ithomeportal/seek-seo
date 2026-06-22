'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, RotateCcw, Search } from 'lucide-react'
import { crmTrailerLabel, formatTermLabel, monthlyDealRevenue, totalContractValue } from '@/lib/crm'
import { crmFetch, crmPost, formatCurrency, formatDate, type CrmDeal, type CrmLead } from './types'

export default function CrmArchiveTab() {
  const [leads, setLeads] = useState<CrmLead[]>([])
  const [deals, setDeals] = useState<CrmDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState<'leads' | 'deals'>('leads')
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [leadsData, dealsData] = await Promise.all([
        crmFetch<CrmLead[]>('/api/admin/crm/leads?archivedOnly=true'),
        crmFetch<CrmDeal[]>('/api/admin/crm/deals?archivedOnly=true'),
      ])
      setLeads(leadsData)
      setDeals(dealsData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load archive')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const q = search.trim().toLowerCase()
  const filteredLeads = useMemo(
    () =>
      leads.filter(
        (l) =>
          !q ||
          l.companyName.toLowerCase().includes(q) ||
          (l.contactName ?? '').toLowerCase().includes(q) ||
          (l.email ?? '').toLowerCase().includes(q) ||
          (l.region ?? '').toLowerCase().includes(q) ||
          (l.state ?? '').toLowerCase().includes(q) ||
          (l.assignedTo ?? '').toLowerCase().includes(q)
      ),
    [leads, q]
  )
  const filteredDeals = useMemo(
    () =>
      deals.filter(
        (d) =>
          !q ||
          d.companyName.toLowerCase().includes(q) ||
          (d.region ?? '').toLowerCase().includes(q) ||
          (d.assignedTo ?? '').toLowerCase().includes(q) ||
          crmTrailerLabel(d.trailerType).toLowerCase().includes(q)
      ),
    [deals, q]
  )

  async function reopenLead(id: number) {
    setBusyId(`lead-${id}`)
    setError('')
    try {
      await crmPost(`/api/admin/crm/leads/${id}/reopen`, {})
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reopen lead')
    } finally {
      setBusyId(null)
    }
  }

  async function reopenDeal(id: number) {
    setBusyId(`deal-${id}`)
    setError('')
    try {
      await crmPost(`/api/admin/crm/deals/${id}/reopen`, {})
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reopen deal')
    } finally {
      setBusyId(null)
    }
  }

  if (loading && leads.length === 0 && deals.length === 0) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading archive…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            onClick={() => setView('leads')}
            className={`px-3 py-1.5 text-base font-semibold ${view === 'leads' ? 'bg-brand-orange text-white' : 'bg-white text-gray-700'}`}
          >
            Lost Leads ({leads.length})
          </button>
          <button
            onClick={() => setView('deals')}
            className={`px-3 py-1.5 text-base font-semibold ${view === 'deals' ? 'bg-brand-orange text-white' : 'bg-white text-gray-700'}`}
          >
            Closed Lost Deals ({deals.length})
          </button>
        </div>
        <div className="relative ml-auto">
          <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search archive…"
            className="border border-gray-300 rounded-lg pl-8 pr-3 py-1.5 text-base"
          />
        </div>
      </div>

      {error && <p className="text-base text-red-600">{error}</p>}

      {view === 'leads' ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-base min-w-[760px]">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b bg-gray-50">
                <th className="px-3 py-2 font-semibold">Company</th>
                <th className="px-3 py-2 font-semibold">Contact</th>
                <th className="px-3 py-2 font-semibold">Region / State</th>
                <th className="px-3 py-2 font-semibold">Owner</th>
                <th className="px-3 py-2 font-semibold">Archived (Lost)</th>
                <th className="px-3 py-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((l) => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-semibold text-gray-900">{l.companyName}</td>
                  <td className="px-3 py-2 text-gray-700">
                    <span className="block">{l.contactName ?? '—'}</span>
                    {(l.email || l.phone) && (
                      <span className="block text-sm text-gray-500">
                        {[l.email, l.phone].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">{l.region ?? '—'}{l.state ? ` / ${l.state}` : ''}</td>
                  <td className="px-3 py-2">{l.assignedTo ?? '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{formatDate(l.updatedAt)}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => reopenLead(l.id)}
                      disabled={busyId === `lead-${l.id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reopen
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-gray-500 text-base">
                    No archived leads.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-base min-w-[860px]">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b bg-gray-50">
                <th className="px-3 py-2 font-semibold">Company</th>
                <th className="px-3 py-2 font-semibold">Type</th>
                <th className="px-3 py-2 font-semibold text-right">Qty</th>
                <th className="px-3 py-2 font-semibold text-right">Monthly</th>
                <th className="px-3 py-2 font-semibold">Term</th>
                <th className="px-3 py-2 font-semibold text-right">TCV</th>
                <th className="px-3 py-2 font-semibold">Owner</th>
                <th className="px-3 py-2 font-semibold">Cancelled</th>
                <th className="px-3 py-2 font-semibold">Reason</th>
                <th className="px-3 py-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeals.map((d) => (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-semibold text-gray-900">{d.companyName}</td>
                  <td className="px-3 py-2">{crmTrailerLabel(d.trailerType)}</td>
                  <td className="px-3 py-2 text-right">{d.quantity}</td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(monthlyDealRevenue(d.quantity, d.monthlyRatePerUnit))}
                  </td>
                  <td className="px-3 py-2">{formatTermLabel(d.rentalTermMonths, d.isMonthToMonth)}</td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {formatCurrency(totalContractValue(d.quantity, d.monthlyRatePerUnit, d.rentalTermMonths, d.isMonthToMonth))}
                  </td>
                  <td className="px-3 py-2">{d.assignedTo ?? '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{formatDate(d.cancelledAt ?? d.closedAt)}</td>
                  <td className="px-3 py-2 text-sm text-gray-600 italic">{d.cancellationReason ?? '—'}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => reopenDeal(d.id)}
                      disabled={busyId === `deal-${d.id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reopen
                    </button>
                  </td>
                </tr>
              ))}
              {filteredDeals.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-gray-500 text-base">
                    No archived deals.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
