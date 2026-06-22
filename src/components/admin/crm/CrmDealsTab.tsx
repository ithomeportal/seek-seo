'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import {
  CRM_TRAILER_TYPES,
  CRM_TRAILER_LABELS,
  DEAL_STAGES,
  REGIONS,
  crmTrailerLabel,
  dealStageToneClass,
  formatTermLabel,
  monthlyDealRevenue,
  progressToneClass,
  totalContractValue,
} from '@/lib/crm'
import CrmDealDialog from './CrmDealDialog'
import { crmFetch, crmPost, formatCurrency, formatDate, type CrmDeal, type CrmLead, type CrmRep } from './types'

type SortKey = 'companyName' | 'trailerType' | 'stage' | 'assignedTo' | 'createdAt' | 'lastActivityAt'

export default function CrmDealsTab() {
  const [deals, setDeals] = useState<CrmDeal[]>([])
  const [leads, setLeads] = useState<CrmLead[]>([])
  const [reps, setReps] = useState<CrmRep[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [stageFilter, setStageFilter] = useState('all')
  const [ownerFilter, setOwnerFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [regionFilter, setRegionFilter] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortAsc, setSortAsc] = useState(false)

  const [showAdd, setShowAdd] = useState(false)
  const [editDeal, setEditDeal] = useState<CrmDeal | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [dealsData, leadsData, repsData] = await Promise.all([
        crmFetch<CrmDeal[]>('/api/admin/crm/deals'),
        crmFetch<CrmLead[]>('/api/admin/crm/leads?includeArchived=true'),
        crmFetch<CrmRep[]>('/api/admin/crm/reps'),
      ])
      setDeals(dealsData)
      setLeads(leadsData)
      setReps(repsData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load deals')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const list = deals.filter((d) => {
      if (stageFilter !== 'all' && d.stage !== stageFilter) return false
      if (ownerFilter !== 'all' && d.assignedTo !== ownerFilter) return false
      if (typeFilter !== 'all' && d.trailerType !== typeFilter) return false
      if (regionFilter !== 'all' && d.region !== regionFilter) return false
      return true
    })
    const dir = sortAsc ? 1 : -1
    return [...list].sort((a, b) => {
      const av = a[sortKey] ?? ''
      const bv = b[sortKey] ?? ''
      if (av === bv) return 0
      return av > bv ? dir : -dir
    })
  }, [deals, stageFilter, ownerFilter, typeFilter, regionFilter, sortKey, sortAsc])

  const totalsMrr = filtered
    .filter((d) => d.stage !== 'Closed Lost')
    .reduce((s, d) => s + monthlyDealRevenue(d.quantity, d.monthlyRatePerUnit), 0)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc)
    else {
      setSortKey(key)
      setSortAsc(key === 'companyName')
    }
  }

  async function handleStageChange(deal: CrmDeal, stage: string) {
    setBusy(true)
    setError('')
    try {
      await crmPost(`/api/admin/crm/deals/${deal.id}/change-stage`, { stage })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to change stage')
    } finally {
      setBusy(false)
    }
  }

  async function handleCancel(deal: CrmDeal) {
    const reason = window.prompt(`Cancel deal for ${deal.companyName}? Reason (optional):`)
    if (reason === null) return
    setBusy(true)
    try {
      await crmPost(`/api/admin/crm/deals/${deal.id}/cancel`, { reason: reason || undefined })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to cancel deal')
    } finally {
      setBusy(false)
    }
  }

  if (loading && deals.length === 0) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading deals…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b shadow-sm rounded-lg px-3 py-2">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-base"
          >
            <option value="all">All Stages</option>
            {DEAL_STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-base"
          >
            <option value="all">All Owners</option>
            {reps.map((r) => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-base"
          >
            <option value="all">All Types</option>
            {CRM_TRAILER_TYPES.map((t) => (
              <option key={t} value={t}>{CRM_TRAILER_LABELS[t]}</option>
            ))}
          </select>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-base"
          >
            <option value="all">All Regions</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {filtered.length} deals · {formatCurrency(totalsMrr)}/mo active
            </span>
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-orange text-white text-base font-semibold hover:bg-brand-orange/90"
            >
              <Plus className="w-4 h-4" /> Add Deal
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-base text-red-600">{error}</p>}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-base min-w-[1000px]">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b bg-gray-50">
              <th className="px-3 py-2 font-semibold cursor-pointer" onClick={() => toggleSort('companyName')}>
                Company {sortKey === 'companyName' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th className="px-3 py-2 font-semibold cursor-pointer" onClick={() => toggleSort('trailerType')}>
                Type {sortKey === 'trailerType' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th className="px-3 py-2 font-semibold text-right">Qty</th>
              <th className="px-3 py-2 font-semibold">Region</th>
              <th className="px-3 py-2 font-semibold">State</th>
              <th className="px-3 py-2 font-semibold text-right">Monthly Rent</th>
              <th className="px-3 py-2 font-semibold">Term</th>
              <th className="px-3 py-2 font-semibold text-right">TCV</th>
              <th className="px-3 py-2 font-semibold cursor-pointer" onClick={() => toggleSort('assignedTo')}>
                Owner {sortKey === 'assignedTo' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th className="px-3 py-2 font-semibold cursor-pointer" onClick={() => toggleSort('lastActivityAt')}>
                Last Activity {sortKey === 'lastActivityAt' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th className="px-3 py-2 font-semibold">Progress</th>
              <th className="px-3 py-2 font-semibold cursor-pointer" onClick={() => toggleSort('stage')}>
                Stage {sortKey === 'stage' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th className="px-3 py-2 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-b last:border-0 hover:bg-orange-50/40">
                <td className="px-3 py-2 font-semibold text-gray-900">{d.companyName}</td>
                <td className="px-3 py-2">{crmTrailerLabel(d.trailerType)}</td>
                <td className="px-3 py-2 text-right">{d.quantity}</td>
                <td className="px-3 py-2">{d.region ?? '—'}</td>
                <td className="px-3 py-2">{d.state ?? '—'}</td>
                <td className="px-3 py-2 text-right">
                  {formatCurrency(monthlyDealRevenue(d.quantity, d.monthlyRatePerUnit))}
                </td>
                <td className="px-3 py-2">{formatTermLabel(d.rentalTermMonths, d.isMonthToMonth)}</td>
                <td className="px-3 py-2 text-right font-semibold">
                  {formatCurrency(totalContractValue(d.quantity, d.monthlyRatePerUnit, d.rentalTermMonths, d.isMonthToMonth))}
                </td>
                <td className="px-3 py-2">{d.assignedTo ?? '—'}</td>
                <td className="px-3 py-2 text-gray-600">
                  {d.lastActivityAt ? formatDate(d.lastActivityAt) : '—'}
                </td>
                <td className="px-3 py-2">
                  {d.progress && (
                    <span className={`inline-block px-2 py-0.5 rounded-full border text-sm font-semibold ${progressToneClass(d.progress)}`}>
                      {d.progress}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <select
                    value={d.stage}
                    disabled={busy}
                    onChange={(e) => handleStageChange(d, e.target.value)}
                    className={`border rounded-lg px-2 py-1 text-sm font-semibold ${dealStageToneClass(d.stage)}`}
                  >
                    {DEAL_STAGES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <button
                    onClick={() => setEditDeal(d)}
                    className="text-sm font-semibold text-brand-blue hover:underline mr-3"
                  >
                    Edit
                  </button>
                  {d.stage !== 'Closed Lost' && (
                    <button
                      onClick={() => handleCancel(d)}
                      className="text-sm font-semibold text-rose-600 hover:underline"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={13} className="px-3 py-8 text-center text-gray-500 text-base">
                  No deals found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <CrmDealDialog
          lead={null}
          leadOptions={leads.map((l) => ({
            id: l.id,
            companyName: l.companyName,
            region: l.region,
            assignedTo: l.assignedTo,
          }))}
          reps={reps}
          onClose={() => setShowAdd(false)}
          onSaved={load}
        />
      )}
      {editDeal && (
        <CrmDealDialog
          deal={editDeal}
          lead={{ id: editDeal.leadId, companyName: editDeal.companyName }}
          reps={reps}
          onClose={() => setEditDeal(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}
