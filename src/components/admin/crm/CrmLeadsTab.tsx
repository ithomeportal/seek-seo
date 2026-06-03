'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, X } from 'lucide-react'
import {
  CRM_TRAILER_TYPES,
  CRM_TRAILER_LABELS,
  DEFAULT_ACTIVITY_OWNER,
  LEAD_SOURCES,
  LEAD_STATUSES,
  REGIONS,
  US_STATES,
  crmTrailerLabel,
  isValidEmail,
  leadStatusToneClass,
  progressToneClass,
  type ProgressState,
} from '@/lib/crm'
import CrmLeadDetail from './CrmLeadDetail'
import { crmFetch, formatDate, type CrmLead, type CrmRep } from './types'

const PROGRESS_STATES: ProgressState[] = ['Advancing', 'Steady', 'Stalling', 'Cold', 'No Activity']

type SortKey = 'companyName' | 'status' | 'assignedTo' | 'createdAt' | 'lastActivityAt'

const EMPTY_FORM = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  region: '',
  state: '',
  source: 'Manual',
  assignedTo: DEFAULT_ACTIVITY_OWNER,
  trailerInterest: [] as string[],
  notes: '',
}

export default function CrmLeadsTab() {
  const [leads, setLeads] = useState<CrmLead[]>([])
  const [reps, setReps] = useState<CrmRep[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [statusFilter, setStatusFilter] = useState('all')
  const [ownerFilter, setOwnerFilter] = useState('all')
  const [regionFilter, setRegionFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [progressFilter, setProgressFilter] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortAsc, setSortAsc] = useState(false)

  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null)

  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY_FORM)
  const [addError, setAddError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [leadsData, repsData] = await Promise.all([
        crmFetch<CrmLead[]>('/api/admin/crm/leads'),
        crmFetch<CrmRep[]>('/api/admin/crm/reps'),
      ])
      setLeads(leadsData)
      setReps(repsData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load leads')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Sources beyond the standard catalog can arrive via import — include them in the filter.
  const sourceOptions = useMemo(() => {
    const set = new Set<string>(LEAD_SOURCES)
    leads.forEach((l) => l.source && set.add(l.source))
    return Array.from(set)
  }, [leads])

  const filtered = useMemo(() => {
    const list = leads.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false
      if (ownerFilter !== 'all' && l.assignedTo !== ownerFilter) return false
      if (regionFilter !== 'all' && l.region !== regionFilter) return false
      if (sourceFilter !== 'all' && l.source !== sourceFilter) return false
      if (progressFilter !== 'all' && l.progress !== progressFilter) return false
      return true
    })
    const dir = sortAsc ? 1 : -1
    return [...list].sort((a, b) => {
      const av = a[sortKey] ?? ''
      const bv = b[sortKey] ?? ''
      if (av === bv) return 0
      return av > bv ? dir : -dir
    })
  }, [leads, statusFilter, ownerFilter, regionFilter, sourceFilter, progressFilter, sortKey, sortAsc])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc)
    else {
      setSortKey(key)
      setSortAsc(key === 'companyName')
    }
  }

  async function handleAddLead() {
    if (!addForm.companyName.trim()) {
      setAddError('Company name is required')
      return
    }
    if (!isValidEmail(addForm.email)) {
      setAddError('A valid email is required (name@company.com)')
      return
    }
    setSaving(true)
    setAddError('')
    try {
      const res = await fetch('/api/admin/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: addForm.companyName.trim(),
          contactName: addForm.contactName.trim() || undefined,
          email: addForm.email.trim(),
          phone: addForm.phone.trim() || undefined,
          region: addForm.region || undefined,
          state: addForm.state || undefined,
          source: addForm.source,
          assignedTo: addForm.assignedTo || undefined,
          trailerInterest: addForm.trailerInterest,
          notes: addForm.notes.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Failed to create lead')
      setShowAdd(false)
      setAddForm(EMPTY_FORM)
      await load()
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Failed to create lead')
    } finally {
      setSaving(false)
    }
  }

  if (selectedLeadId !== null) {
    return (
      <CrmLeadDetail
        leadId={selectedLeadId}
        reps={reps}
        onBack={() => {
          setSelectedLeadId(null)
          load()
        }}
      />
    )
  }

  if (loading && leads.length === 0) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading leads…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b shadow-sm rounded-lg px-3 py-2">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-base"
          >
            <option value="all">All Statuses</option>
            {LEAD_STATUSES.map((s) => (
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
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-base"
          >
            <option value="all">All Regions</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-base"
          >
            <option value="all">All Sources</option>
            {sourceOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={progressFilter}
            onChange={(e) => setProgressFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-base"
          >
            <option value="all">All Progress</option>
            {PROGRESS_STATES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-500">{filtered.length} leads</span>
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-orange text-white text-base font-semibold hover:bg-brand-orange/90"
            >
              <Plus className="w-4 h-4" /> Add Lead
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-base text-red-600">{error}</p>}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-base min-w-[900px]">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b bg-gray-50">
              <th className="px-3 py-2 font-semibold cursor-pointer" onClick={() => toggleSort('companyName')}>
                Company {sortKey === 'companyName' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th className="px-3 py-2 font-semibold">Contact</th>
              <th className="px-3 py-2 font-semibold">Region / State</th>
              <th className="px-3 py-2 font-semibold cursor-pointer" onClick={() => toggleSort('status')}>
                Status {sortKey === 'status' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th className="px-3 py-2 font-semibold cursor-pointer" onClick={() => toggleSort('assignedTo')}>
                Owner {sortKey === 'assignedTo' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th className="px-3 py-2 font-semibold cursor-pointer" onClick={() => toggleSort('createdAt')}>
                Created {sortKey === 'createdAt' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th className="px-3 py-2 font-semibold cursor-pointer" onClick={() => toggleSort('lastActivityAt')}>
                Last Activity {sortKey === 'lastActivityAt' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th className="px-3 py-2 font-semibold">Progress</th>
              <th className="px-3 py-2 font-semibold">Trailers</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead) => (
              <tr
                key={lead.id}
                onClick={() => setSelectedLeadId(lead.id)}
                className="border-b last:border-0 hover:bg-orange-50/50 cursor-pointer"
              >
                <td className="px-3 py-2 font-semibold text-gray-900">{lead.companyName}</td>
                <td className="px-3 py-2 text-gray-700">
                  <div>{lead.contactName ?? '—'}</div>
                  {lead.email && <div className="text-sm text-gray-500">{lead.email}</div>}
                </td>
                <td className="px-3 py-2 text-gray-700">
                  {lead.region ?? '—'}
                  {lead.state ? ` / ${lead.state}` : ''}
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-block px-2 py-0.5 rounded-full border text-sm font-semibold ${leadStatusToneClass(lead.status)}`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-700">{lead.assignedTo ?? '—'}</td>
                <td className="px-3 py-2 text-gray-600">{formatDate(lead.createdAt)}</td>
                <td className="px-3 py-2 text-gray-600">
                  {lead.lastActivityAt ? (
                    <>
                      {formatDate(lead.lastActivityAt)}
                      {lead.lastActivityType && (
                        <span className="text-sm text-gray-400"> · {lead.lastActivityType}</span>
                      )}
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3 py-2">
                  {lead.progress && (
                    <span className={`inline-block px-2 py-0.5 rounded-full border text-sm font-semibold ${progressToneClass(lead.progress)}`}>
                      {lead.progress}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-sm text-gray-600">
                  {lead.trailerInterest.length
                    ? lead.trailerInterest.map(crmTrailerLabel).join(', ')
                    : '—'}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-gray-500 text-base">
                  No leads found. Add one with the button above, or use the Import tab.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Lead dialog */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-900">Add Lead</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Company *</span>
                  <input
                    value={addForm.companyName}
                    onChange={(e) => setAddForm({ ...addForm, companyName: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Contact</span>
                  <input
                    value={addForm.contactName}
                    onChange={(e) => setAddForm({ ...addForm, contactName: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Email *</span>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Phone</span>
                  <input
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Region</span>
                  <select
                    value={addForm.region}
                    onChange={(e) => setAddForm({ ...addForm, region: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
                  >
                    <option value="">—</option>
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">State</span>
                  <select
                    value={addForm.state}
                    onChange={(e) => setAddForm({ ...addForm, state: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
                  >
                    <option value="">—</option>
                    {US_STATES.map((s) => (
                      <option key={s.code} value={s.code}>{s.code} — {s.name}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Source</span>
                  <select
                    value={addForm.source}
                    onChange={(e) => setAddForm({ ...addForm, source: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
                  >
                    {LEAD_SOURCES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Assigned To</span>
                  <select
                    value={addForm.assignedTo}
                    onChange={(e) => setAddForm({ ...addForm, assignedTo: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
                  >
                    {reps.map((r) => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-700">Trailer Interest</span>
                <div className="mt-1 flex items-center gap-3 flex-wrap">
                  {CRM_TRAILER_TYPES.map((t) => (
                    <label key={t} className="inline-flex items-center gap-1.5 text-base text-gray-700">
                      <input
                        type="checkbox"
                        checked={addForm.trailerInterest.includes(t)}
                        onChange={(e) =>
                          setAddForm({
                            ...addForm,
                            trailerInterest: e.target.checked
                              ? [...addForm.trailerInterest, t]
                              : addForm.trailerInterest.filter((x) => x !== t),
                          })
                        }
                        className="rounded border-gray-300"
                      />
                      {CRM_TRAILER_LABELS[t]}
                    </label>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Notes</span>
                <textarea
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  rows={3}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
                />
              </label>
              {addError && <p className="text-base text-red-600">{addError}</p>}
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t">
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-base font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLead}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-brand-orange text-white text-base font-semibold hover:bg-brand-orange/90 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Add Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
