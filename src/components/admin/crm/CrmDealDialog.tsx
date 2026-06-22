'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import {
  CRM_TRAILER_TYPES,
  CRM_TRAILER_LABELS,
  DEAL_STAGES,
  REGIONS,
  US_STATES,
  defaultMonthlyRateFor,
  formatTermLabel,
  monthlyDealRevenue,
  totalContractValue,
} from '@/lib/crm'
import { formatCurrency, type CrmDeal, type CrmRep } from './types'

interface LeadOption {
  id: number
  companyName: string
  region?: string | null
  assignedTo?: string | null
}

interface Props {
  deal?: CrmDeal // present = edit mode
  lead: LeadOption | null // locked parent lead (add from LeadDetail); null = pick from leadOptions
  leadOptions?: LeadOption[]
  reps: CrmRep[]
  onClose: () => void
  onSaved: () => void
}

export default function CrmDealDialog({ deal, lead, leadOptions = [], reps, onClose, onSaved }: Props) {
  const isEdit = Boolean(deal)
  const [leadId, setLeadId] = useState<number | ''>(deal?.leadId ?? lead?.id ?? '')
  const [trailerType, setTrailerType] = useState(deal?.trailerType ?? 'sand_chassis')
  const [quantity, setQuantity] = useState(String(deal?.quantity ?? 1))
  const [rate, setRate] = useState(String(deal?.monthlyRatePerUnit ?? defaultMonthlyRateFor('sand_chassis')))
  const [term, setTerm] = useState(String(deal?.rentalTermMonths ?? 12))
  const [mtm, setMtm] = useState(deal?.isMonthToMonth ?? false)
  const [region, setRegion] = useState(deal?.region ?? lead?.region ?? '')
  const [stateCode, setStateCode] = useState(deal?.state ?? '')
  const [stage, setStage] = useState(deal?.stage ?? 'Qualification')
  const [assignedTo, setAssignedTo] = useState(deal?.assignedTo ?? lead?.assignedTo ?? reps[0]?.name ?? '')
  const [expectedClose, setExpectedClose] = useState(deal?.expectedCloseDate ?? '')
  const [notes, setNotes] = useState(deal?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const qtyNum = Math.max(1, parseInt(quantity, 10) || 1)
  const rateNum = Math.max(0, parseFloat(rate) || 0)
  const termNum = Math.max(1, parseInt(term, 10) || 1)
  const previewMrr = monthlyDealRevenue(qtyNum, rateNum)
  const previewTcv = totalContractValue(qtyNum, rateNum, termNum, mtm)

  function handleTypeChange(next: string) {
    setTrailerType(next)
    if (!isEdit) setRate(String(defaultMonthlyRateFor(next)))
  }

  async function handleSave() {
    setError('')
    const selectedLead = lead ?? leadOptions.find((l) => l.id === leadId)
    if (!isEdit && !selectedLead) {
      setError('Pick a lead for this deal')
      return
    }
    setSaving(true)
    try {
      const payload = {
        trailerType,
        quantity: qtyNum,
        monthlyRatePerUnit: rateNum,
        rentalTermMonths: termNum,
        isMonthToMonth: mtm,
        region: region || undefined,
        state: stateCode || undefined,
        stage,
        assignedTo: assignedTo || undefined,
        expectedCloseDate: expectedClose || undefined,
        notes: notes.trim() || undefined,
      }
      const res = isEdit
        ? await fetch(`/api/admin/crm/deals/${deal?.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/admin/crm/deals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...payload,
              leadId: selectedLead?.id,
              companyName: selectedLead?.companyName,
            }),
          })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Failed to save deal')
      onSaved()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save deal')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white">
          <h3 className="text-lg font-bold text-gray-900">
            {isEdit ? `Edit Deal — ${deal?.companyName}` : `Add Deal${lead ? ` — ${lead.companyName}` : ''}`}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {!isEdit && !lead && (
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Lead *</span>
              <select
                value={leadId}
                onChange={(e) => setLeadId(e.target.value ? Number(e.target.value) : '')}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
              >
                <option value="">Pick a lead…</option>
                {leadOptions.map((l) => (
                  <option key={l.id} value={l.id}>{l.companyName}</option>
                ))}
              </select>
            </label>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Trailer Type</span>
              <select
                value={trailerType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
              >
                {CRM_TRAILER_TYPES.map((t) => (
                  <option key={t} value={t}>{CRM_TRAILER_LABELS[t]}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Quantity</span>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Monthly Rate / Unit ($)</span>
              <input
                type="number"
                min={0}
                step="50"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Term (months)</span>
              <input
                type="number"
                min={1}
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                disabled={mtm}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base disabled:bg-gray-100"
              />
            </label>
            <label className="inline-flex items-center gap-2 text-base text-gray-700 mt-1">
              <input
                type="checkbox"
                checked={mtm}
                onChange={(e) => setMtm(e.target.checked)}
                className="rounded border-gray-300"
              />
              Month-to-month (TCV = 1 month)
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Region</span>
              <select
                value={region ?? ''}
                onChange={(e) => setRegion(e.target.value)}
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
                value={stateCode ?? ''}
                onChange={(e) => setStateCode(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
              >
                <option value="">—</option>
                {US_STATES.map((s) => (
                  <option key={s.code} value={s.code}>{s.code} — {s.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Stage</span>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
              >
                {DEAL_STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Owner</span>
              <select
                value={assignedTo ?? ''}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
              >
                <option value="">—</option>
                {reps.map((r) => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Expected Close</span>
              <input
                type="date"
                value={expectedClose ?? ''}
                onChange={(e) => setExpectedClose(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Notes</span>
            <textarea
              value={notes ?? ''}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
            />
          </label>
          <div className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 text-base text-gray-800">
            Preview: <span className="font-semibold">{formatCurrency(previewMrr)}/mo</span> ·{' '}
            {formatTermLabel(termNum, mtm)} · TCV <span className="font-semibold">{formatCurrency(previewTcv)}</span>
          </div>
          {error && <p className="text-base text-red-600">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-base font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-brand-orange text-white text-base font-semibold hover:bg-brand-orange/90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Deal'}
          </button>
        </div>
      </div>
    </div>
  )
}
