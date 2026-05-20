'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Download, Plus, X, Trash2 } from 'lucide-react'
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type DeprCategory,
} from '@/lib/depreciation'

interface DeprRow {
  id: number
  fleetUnitId: number | null
  category: DeprCategory
  unitNumber: string
  itemDescription: string | null
  dateAcquired: string
  cost: number
  deprYears: number
  priorYearEndAccumulated: number
  soldDate: string | null
  salePrice: number | null
  notes: string | null
  perYear: number
  perMonth: number
  monthsThisYear: number
  annualTotalYTD: number
  accumulated: number
  bookValue: number
  fullyDepreciated: boolean
}

interface DeprGroup {
  category: DeprCategory
  items: DeprRow[]
  subtotal: {
    cost: number
    accumulated: number
    bookValue: number
    annualTotalYTD: number
    priorYearEndAccumulated: number
  }
}

interface DeprSummary {
  asOf: string
  asOfYear: number
  totalUnits: number
  beginningBalanceCost: number
  acquiredYTD: number
  disposedYTD: number
  endBalanceCost: number
  totalCost: number
  totalPriorAccum: number
  totalAnnualYTD: number
  totalAccumulated: number
  totalBookValue: number
}

function fmtCurrency(n: number | null | undefined): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

function fmtCurrencyCents(n: number | null | undefined): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const inputClass =
  'w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue/50'
const labelClass = 'block text-xs font-medium text-gray-600 mb-1'

interface FormState {
  category: DeprCategory
  unitNumber: string
  itemDescription: string
  dateAcquired: string
  cost: string
  deprYears: string
  priorYearEndAccumulated: string
  soldDate: string
  notes: string
}

const emptyForm: FormState = {
  category: 'chassis',
  unitNumber: '',
  itemDescription: '',
  dateAcquired: '',
  cost: '',
  deprYears: '3',
  priorYearEndAccumulated: '0',
  soldDate: '',
  notes: '',
}

export default function DepreciationTab() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [asOf, setAsOf] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [data, setData] = useState<{ rows: DeprRow[]; groups: DeprGroup[]; summary: DeprSummary } | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<DeprRow | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/depreciation?asOf=${asOf}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to load')
      setData(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load depreciation data')
    } finally {
      setLoading(false)
    }
  }, [asOf])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function openEdit(row: DeprRow) {
    setForm({
      category: row.category,
      unitNumber: row.unitNumber,
      itemDescription: row.itemDescription ?? '',
      dateAcquired: row.dateAcquired.split('T')[0],
      cost: String(row.cost),
      deprYears: String(row.deprYears),
      priorYearEndAccumulated: String(row.priorYearEndAccumulated),
      soldDate: row.soldDate ? row.soldDate.split('T')[0] : '',
      notes: row.notes ?? '',
    })
    setEditing(row)
  }

  function openAdd() {
    setForm(emptyForm)
    setEditing(null)
    setShowAdd(true)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        category: form.category,
        unitNumber: form.unitNumber.trim(),
        itemDescription: form.itemDescription.trim() || null,
        dateAcquired: form.dateAcquired,
        cost: parseFloat(form.cost),
        deprYears: parseInt(form.deprYears, 10),
        priorYearEndAccumulated: form.priorYearEndAccumulated
          ? parseFloat(form.priorYearEndAccumulated)
          : 0,
        soldDate: form.soldDate || null,
        notes: form.notes.trim() || null,
      }
      const url = editing
        ? `/api/admin/depreciation/${editing.id}`
        : '/api/admin/depreciation'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to save')
      setShowAdd(false)
      setEditing(null)
      await fetchData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this depreciation record? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/admin/depreciation/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to delete')
      setEditing(null)
      await fetchData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  const modalOpen = showAdd || editing !== null

  const groups = useMemo(() => data?.groups ?? [], [data])
  const summary = data?.summary

  return (
    <div className="space-y-3">
      {/* Header / controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600">As of</label>
          <input
            type="date"
            value={asOf}
            onChange={(e) => setAsOf(e.target.value)}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-sm"
          />
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded bg-brand-orange px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-orange/90"
        >
          <Plus className="h-3.5 w-3.5" /> Add Record
        </button>
        <a
          href={`/api/admin/depreciation/export?asOf=${asOf}`}
          className="inline-flex items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Download className="h-3.5 w-3.5" /> Export xlsx
        </a>
        {data && (
          <span className="text-xs text-gray-500">
            {data.summary.totalUnits} assets · cost {fmtCurrency(data.summary.totalCost)}
          </span>
        )}
      </div>

      {/* Summary KPI strip */}
      {summary && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Kpi label="Total Cost" value={fmtCurrency(summary.totalCost)} className="bg-gray-900 text-white" />
          <Kpi label={`Acquired ${summary.asOfYear}`} value={fmtCurrency(summary.acquiredYTD)} className="bg-blue-50 text-blue-700" />
          <Kpi label={`Disposed ${summary.asOfYear}`} value={fmtCurrency(summary.disposedYTD)} className="bg-red-50 text-red-700" />
          <Kpi label="End Balance" value={fmtCurrency(summary.endBalanceCost)} className="bg-green-50 text-green-700" />
          <Kpi label={`YTD Depr.`} value={fmtCurrency(summary.totalAnnualYTD)} className="bg-orange-50 text-orange-700" />
          <Kpi label="Accumulated" value={fmtCurrency(summary.totalAccumulated)} className="bg-gray-100 text-gray-700" />
          <Kpi label="Book Value" value={fmtCurrency(summary.totalBookValue)} className="bg-brand-orange text-white" />
        </div>
      )}

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      )}

      {/* Tables grouped by category */}
      {loading && !data ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50 sticky top-0 z-10">
                <th className="px-2 py-2 text-left font-medium text-gray-500">Date</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500">Unit</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500">Item / Description</th>
                <th className="px-2 py-2 text-right font-medium text-gray-500">Cost</th>
                <th className="px-2 py-2 text-right font-medium text-gray-500">Depr. Yrs</th>
                <th className="px-2 py-2 text-right font-medium text-gray-500">Per Year</th>
                <th className="px-2 py-2 text-right font-medium text-gray-500">Per Month</th>
                <th className="px-2 py-2 text-right font-medium text-gray-500"># Mo</th>
                <th className="px-2 py-2 text-right font-medium text-gray-500">Annual Total</th>
                <th className="px-2 py-2 text-right font-medium text-gray-500">Prior YR End</th>
                <th className="px-2 py-2 text-right font-medium text-gray-500">Accumulated</th>
                <th className="px-2 py-2 text-right font-medium text-gray-500">Book Value</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500">Sold</th>
                <th className="px-2 py-2 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {groups.length === 0 && !loading && (
                <tr>
                  <td colSpan={14} className="px-3 py-8 text-center text-gray-400">
                    No depreciation records yet. Click <span className="font-semibold">Add Record</span> to begin.
                  </td>
                </tr>
              )}
              {groups.map((group) => (
                <CategoryRows key={group.category} group={group} onEdit={openEdit} />
              ))}
              {summary && groups.length > 0 && (
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                  <td className="px-2 py-2" colSpan={3}>GRAND TOTAL</td>
                  <td className="px-2 py-2 text-right tabular-nums">{fmtCurrencyCents(summary.totalCost)}</td>
                  <td className="px-2 py-2" colSpan={4}></td>
                  <td className="px-2 py-2 text-right tabular-nums">{fmtCurrencyCents(summary.totalAnnualYTD)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{fmtCurrencyCents(summary.totalPriorAccum)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{fmtCurrencyCents(summary.totalAccumulated)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{fmtCurrencyCents(summary.totalBookValue)}</td>
                  <td className="px-2 py-2" colSpan={2}></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? `Edit ${editing.unitNumber}` : 'Add Depreciation Record'}
              </h2>
              <button
                onClick={() => {
                  setShowAdd(false)
                  setEditing(null)
                }}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 px-5 py-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as DeprCategory })}
                    className={inputClass}
                  >
                    {CATEGORY_ORDER.map((c) => (
                      <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Unit #</label>
                  <input
                    type="text"
                    value={form.unitNumber}
                    onChange={(e) => setForm({ ...form, unitNumber: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. CH005 or 2025 RAM"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Item / Description</label>
                <input
                  type="text"
                  value={form.itemDescription}
                  onChange={(e) => setForm({ ...form, itemDescription: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. 2019 Prohaul VIN# 724810"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Date Acquired</label>
                  <input
                    type="date"
                    value={form.dateAcquired}
                    onChange={(e) => setForm({ ...form, dateAcquired: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Depr. # Years</label>
                  <input
                    type="number"
                    value={form.deprYears}
                    onChange={(e) => setForm({ ...form, deprYears: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Prior Year-End Accumulated</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.priorYearEndAccumulated}
                    onChange={(e) => setForm({ ...form, priorYearEndAccumulated: e.target.value })}
                    className={inputClass}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className={labelClass}>Sold / Removed Date</label>
                  <input
                    type="date"
                    value={form.soldDate}
                    onChange={(e) => setForm({ ...form, soldDate: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className={inputClass}
                  rows={2}
                  placeholder="Purchase source, sale buyer, etc."
                />
              </div>
              {editing && (
                <div className="rounded border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                  <p className="font-semibold mb-1">Computed (as-of {fmtDate(asOf)})</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>Per Year: <span className="font-mono">{fmtCurrencyCents(editing.perYear)}</span></div>
                    <div>Per Month: <span className="font-mono">{fmtCurrencyCents(editing.perMonth)}</span></div>
                    <div># Mo this year: <span className="font-mono">{editing.monthsThisYear}</span></div>
                    <div>Annual YTD: <span className="font-mono">{fmtCurrencyCents(editing.annualTotalYTD)}</span></div>
                    <div>Accumulated: <span className="font-mono">{fmtCurrencyCents(editing.accumulated)}</span></div>
                    <div>Book Value: <span className="font-mono">{fmtCurrencyCents(editing.bookValue)}</span></div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 border-t bg-gray-50 px-5 py-3">
              {editing ? (
                <button
                  onClick={() => handleDelete(editing.id)}
                  className="inline-flex items-center gap-1.5 rounded text-sm text-red-600 hover:bg-red-50 px-2 py-1"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              ) : <span />}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAdd(false)
                    setEditing(null)
                  }}
                  className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !form.unitNumber.trim() || !form.dateAcquired || !form.cost}
                  className="rounded bg-brand-orange px-5 py-2 text-sm font-medium text-white hover:bg-brand-orange/90 disabled:opacity-50"
                >
                  {submitting ? 'Saving…' : editing ? 'Save Changes' : 'Add Record'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Kpi({ label, value, className }: { label: string; value: string; className: string }) {
  return (
    <div className={`rounded-lg px-2.5 py-1.5 ${className}`}>
      <p className="text-[10px] font-semibold uppercase opacity-70 leading-tight">{label}</p>
      <p className="text-lg font-bold leading-tight">{value}</p>
    </div>
  )
}

function CategoryRows({ group, onEdit }: { group: DeprGroup; onEdit: (r: DeprRow) => void }) {
  return (
    <>
      <tr className="bg-gray-100">
        <td colSpan={14} className="px-2 py-1.5 text-xs font-bold uppercase tracking-wide text-gray-700">
          {CATEGORY_LABELS[group.category]}
        </td>
      </tr>
      {group.items.map((r) => (
        <tr key={r.id} className={`hover:bg-blue-50/40 ${r.soldDate ? 'opacity-60' : ''}`}>
          <td className="px-2 py-1 whitespace-nowrap text-gray-600">{fmtDate(r.dateAcquired)}</td>
          <td className="px-2 py-1 font-semibold text-gray-900">{r.unitNumber}</td>
          <td className="px-2 py-1 text-gray-500 truncate max-w-xs">{r.itemDescription ?? '—'}</td>
          <td className="px-2 py-1 text-right tabular-nums text-gray-900">{fmtCurrencyCents(r.cost)}</td>
          <td className="px-2 py-1 text-right tabular-nums text-gray-500">{r.deprYears}</td>
          <td className="px-2 py-1 text-right tabular-nums text-gray-700">{fmtCurrencyCents(r.perYear)}</td>
          <td className="px-2 py-1 text-right tabular-nums text-gray-700">{fmtCurrencyCents(r.perMonth)}</td>
          <td className="px-2 py-1 text-right tabular-nums text-gray-500">{r.monthsThisYear}</td>
          <td className="px-2 py-1 text-right tabular-nums text-gray-700">{fmtCurrencyCents(r.annualTotalYTD)}</td>
          <td className="px-2 py-1 text-right tabular-nums text-gray-500">{fmtCurrencyCents(r.priorYearEndAccumulated)}</td>
          <td className="px-2 py-1 text-right tabular-nums text-gray-700">{fmtCurrencyCents(r.accumulated)}</td>
          <td className="px-2 py-1 text-right tabular-nums font-medium text-gray-900">{fmtCurrencyCents(r.bookValue)}</td>
          <td className="px-2 py-1 whitespace-nowrap text-gray-500">{r.soldDate ? fmtDate(r.soldDate) : <span className="text-gray-300">—</span>}</td>
          <td className="px-2 py-1 text-center">
            <button
              onClick={() => onEdit(r)}
              className="rounded px-2 py-0.5 text-xs font-medium text-brand-blue hover:bg-brand-blue/10"
            >
              Edit
            </button>
          </td>
        </tr>
      ))}
      <tr className="bg-gray-50 font-semibold">
        <td colSpan={3} className="px-2 py-1 text-xs text-gray-600">
          {CATEGORY_LABELS[group.category]} subtotal ({group.items.length})
        </td>
        <td className="px-2 py-1 text-right tabular-nums">{fmtCurrencyCents(group.subtotal.cost)}</td>
        <td className="px-2 py-1" colSpan={4}></td>
        <td className="px-2 py-1 text-right tabular-nums">{fmtCurrencyCents(group.subtotal.annualTotalYTD)}</td>
        <td className="px-2 py-1 text-right tabular-nums">{fmtCurrencyCents(group.subtotal.priorYearEndAccumulated)}</td>
        <td className="px-2 py-1 text-right tabular-nums">{fmtCurrencyCents(group.subtotal.accumulated)}</td>
        <td className="px-2 py-1 text-right tabular-nums">{fmtCurrencyCents(group.subtotal.bookValue)}</td>
        <td className="px-2 py-1" colSpan={2}></td>
      </tr>
    </>
  )
}
