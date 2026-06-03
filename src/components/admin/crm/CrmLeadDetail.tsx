'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Loader2, Pencil, Plus, RotateCcw } from 'lucide-react'
import {
  ACTIVITY_TYPES,
  DEAL_STAGES,
  LEAD_STATUSES,
  REGIONS,
  US_STATES,
  crmTrailerLabel,
  dealStageToneClass,
  formatTermLabel,
  leadStatusToneClass,
  monthlyDealRevenue,
  totalContractValue,
} from '@/lib/crm'
import CrmDealDialog from './CrmDealDialog'
import {
  crmFetch,
  crmPost,
  formatCurrency,
  formatDate,
  formatDateTime,
  type CrmActivity,
  type CrmDeal,
  type CrmLead,
  type CrmRep,
} from './types'

interface Props {
  leadId: number
  reps: CrmRep[]
  onBack: () => void
}

interface DetailData {
  lead: CrmLead
  deals: CrmDeal[]
  activities: CrmActivity[]
}

export default function CrmLeadDetail({ leadId, reps, onBack }: Props) {
  const [data, setData] = useState<DetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Contact editing
  const [editingContact, setEditingContact] = useState(false)
  const [contactForm, setContactForm] = useState({ contactName: '', email: '', phone: '', region: '', state: '' })

  // Notes editing
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState('')

  // Activity form
  const [actType, setActType] = useState<string>('Call')
  const [actNotes, setActNotes] = useState('')
  const [actFollowUpDate, setActFollowUpDate] = useState('')
  const [actFollowUpTime, setActFollowUpTime] = useState('07:00')
  const [actOwner, setActOwner] = useState('')
  const [actSaving, setActSaving] = useState(false)

  // Deal dialogs
  const [showAddDeal, setShowAddDeal] = useState(false)
  const [editDeal, setEditDeal] = useState<CrmDeal | null>(null)

  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      const d = await crmFetch<DetailData>(`/api/admin/crm/leads/${leadId}`)
      setData(d)
      setContactForm({
        contactName: d.lead.contactName ?? '',
        email: d.lead.email ?? '',
        phone: d.lead.phone ?? '',
        region: d.lead.region ?? '',
        state: d.lead.state ?? '',
      })
      setNotesDraft(d.lead.notes ?? '')
      if (!actOwner) setActOwner(d.lead.assignedTo ?? reps[0]?.name ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load lead')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId])

  useEffect(() => {
    load()
  }, [load])

  async function patchLead(patch: Record<string, unknown>) {
    setBusy(true)
    setError('')
    try {
      await crmPost(`/api/admin/crm/leads/${leadId}`, patch, 'PATCH')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleLogActivity() {
    setActSaving(true)
    setError('')
    try {
      await crmPost('/api/admin/crm/activities', {
        relatedToType: 'Lead',
        relatedToId: leadId,
        activityType: actType,
        notes: actNotes.trim() || undefined,
        assignedTo: actOwner || undefined,
        followUpDate: actFollowUpDate
          ? actFollowUpTime
            ? `${actFollowUpDate}T${actFollowUpTime}`
            : actFollowUpDate
          : undefined,
      })
      setActNotes('')
      setActFollowUpDate('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to log activity')
    } finally {
      setActSaving(false)
    }
  }

  async function handleDealStageChange(deal: CrmDeal, stage: string) {
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

  async function handleCancelDeal(deal: CrmDeal) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading lead…
      </div>
    )
  }
  if (!data) {
    return (
      <div className="space-y-3">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-base text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back to Leads
        </button>
        <p className="text-base text-red-600">{error || 'Lead not found.'}</p>
      </div>
    )
  }

  const { lead, deals, activities } = data
  const activeDeals = deals.filter((d) => d.stage !== 'Closed Lost')
  const totalsMrr = activeDeals.reduce((s, d) => s + monthlyDealRevenue(d.quantity, d.monthlyRatePerUnit), 0)
  const totalsTcv = activeDeals.reduce(
    (s, d) => s + totalContractValue(d.quantity, d.monthlyRatePerUnit, d.rentalTermMonths, d.isMonthToMonth),
    0
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-base text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back to Leads
        </button>
        {lead.isArchived && (
          <button
            onClick={() => crmPost(`/api/admin/crm/leads/${leadId}/reopen`, {}).then(load)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-base font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RotateCcw className="w-4 h-4" /> Reopen Lead
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{lead.companyName}</h2>
            <p className="text-base text-gray-600 mt-0.5">
              {lead.contactName ?? 'No contact'} · {lead.email ?? 'no email'}
              {lead.phone ? ` · ${lead.phone}` : ''}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {lead.region ?? '—'}{lead.state ? ` / ${lead.state}` : ''} · Source: {lead.source ?? '—'} · Created{' '}
              {formatDate(lead.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={lead.status}
              disabled={busy}
              onChange={(e) => patchLead({ status: e.target.value })}
              className={`border rounded-lg px-2 py-1.5 text-base font-semibold ${leadStatusToneClass(lead.status)}`}
            >
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={lead.assignedTo ?? ''}
              disabled={busy}
              onChange={(e) => patchLead({ assignedTo: e.target.value || null })}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-base"
            >
              <option value="">Unassigned</option>
              {reps.map((r) => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>
        {lead.trailerInterest.length > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            Interested in: <span className="font-semibold">{lead.trailerInterest.map(crmTrailerLabel).join(', ')}</span>
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Contact card */}
        <div className={`bg-white rounded-xl border p-4 ${!lead.email ? 'border-amber-300 bg-amber-50/40' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-gray-900">Contact Info</h3>
            {!editingContact && (
              <button
                onClick={() => setEditingContact(true)}
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:underline"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
            )}
          </div>
          {editingContact ? (
            <div className="space-y-2">
              <div className="grid sm:grid-cols-2 gap-2">
                <input
                  placeholder="Contact name"
                  value={contactForm.contactName}
                  onChange={(e) => setContactForm({ ...contactForm, contactName: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-base"
                />
                <input
                  placeholder="Email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-base"
                />
                <input
                  placeholder="Phone"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-base"
                />
                <select
                  value={contactForm.region}
                  onChange={(e) => setContactForm({ ...contactForm, region: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-base"
                >
                  <option value="">Region —</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <select
                  value={contactForm.state}
                  onChange={(e) => setContactForm({ ...contactForm, state: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-base"
                >
                  <option value="">State —</option>
                  {US_STATES.map((s) => (
                    <option key={s.code} value={s.code}>{s.code}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    patchLead({
                      contactName: contactForm.contactName.trim() || null,
                      email: contactForm.email.trim() || null,
                      phone: contactForm.phone.trim() || null,
                      region: contactForm.region || null,
                      state: contactForm.state || null,
                    }).then(() => setEditingContact(false))
                  }
                  disabled={busy}
                  className="px-3 py-1.5 rounded-lg bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange/90 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingContact(false)}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <dl className="text-base text-gray-700 space-y-1">
              <div><dt className="inline text-gray-500">Contact: </dt><dd className="inline">{lead.contactName ?? '—'}</dd></div>
              <div>
                <dt className="inline text-gray-500">Email: </dt>
                <dd className="inline">{lead.email ?? <span className="text-amber-700 font-semibold">missing</span>}</dd>
              </div>
              <div><dt className="inline text-gray-500">Phone: </dt><dd className="inline">{lead.phone ?? '—'}</dd></div>
              <div>
                <dt className="inline text-gray-500">Region / State: </dt>
                <dd className="inline">{lead.region ?? '—'}{lead.state ? ` / ${lead.state}` : ''}</dd>
              </div>
            </dl>
          )}
        </div>

        {/* Notes card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-gray-900">Lead Notes</h3>
            {!editingNotes && (
              <button
                onClick={() => setEditingNotes(true)}
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:underline"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
            )}
          </div>
          {editingNotes ? (
            <div className="space-y-2">
              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => patchLead({ notes: notesDraft.trim() || null }).then(() => setEditingNotes(false))}
                  disabled={busy}
                  className="px-3 py-1.5 rounded-lg bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange/90 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setNotesDraft(lead.notes ?? '')
                    setEditingNotes(false)
                  }}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-base text-gray-700 whitespace-pre-wrap">{lead.notes || 'No notes yet.'}</p>
          )}
        </div>
      </div>

      {/* Deals */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-x-auto">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-base font-bold text-gray-900">Deals ({deals.length})</h3>
          <button
            onClick={() => setShowAddDeal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-orange text-white text-base font-semibold hover:bg-brand-orange/90"
          >
            <Plus className="w-4 h-4" /> Add Deal
          </button>
        </div>
        <table className="w-full text-base min-w-[760px]">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="py-1.5 pr-2 font-semibold">Trailer Type</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Qty</th>
              <th className="py-1.5 pr-2 font-semibold">Stage</th>
              <th className="py-1.5 pr-2 font-semibold text-right">Monthly Rent</th>
              <th className="py-1.5 pr-2 font-semibold">Term</th>
              <th className="py-1.5 pr-2 font-semibold">Expected Close</th>
              <th className="py-1.5 pr-2 font-semibold text-right">TCV</th>
              <th className="py-1.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((d) => (
              <tr key={d.id} className={`border-b last:border-0 ${d.stage === 'Closed Lost' ? 'opacity-60' : ''}`}>
                <td className="py-2 pr-2 font-medium text-gray-900">{crmTrailerLabel(d.trailerType)}</td>
                <td className="py-2 pr-2 text-right">{d.quantity}</td>
                <td className="py-2 pr-2">
                  <select
                    value={d.stage}
                    disabled={busy}
                    onChange={(e) => handleDealStageChange(d, e.target.value)}
                    className={`border rounded-lg px-2 py-1 text-sm font-semibold ${dealStageToneClass(d.stage)}`}
                  >
                    {DEAL_STAGES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="py-2 pr-2 text-right">
                  {formatCurrency(monthlyDealRevenue(d.quantity, d.monthlyRatePerUnit))}
                </td>
                <td className="py-2 pr-2">{formatTermLabel(d.rentalTermMonths, d.isMonthToMonth)}</td>
                <td className="py-2 pr-2">{d.expectedCloseDate || '—'}</td>
                <td className="py-2 pr-2 text-right font-semibold">
                  {formatCurrency(totalContractValue(d.quantity, d.monthlyRatePerUnit, d.rentalTermMonths, d.isMonthToMonth))}
                </td>
                <td className="py-2 text-right whitespace-nowrap">
                  <button
                    onClick={() => setEditDeal(d)}
                    className="text-sm font-semibold text-brand-blue hover:underline mr-3"
                  >
                    Edit
                  </button>
                  {d.stage !== 'Closed Lost' ? (
                    <button
                      onClick={() => handleCancelDeal(d)}
                      className="text-sm font-semibold text-rose-600 hover:underline"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      onClick={() => crmPost(`/api/admin/crm/deals/${d.id}/reopen`, {}).then(load)}
                      className="text-sm font-semibold text-emerald-700 hover:underline"
                    >
                      Reopen
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {deals.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-gray-500 text-base">No deals yet.</td>
              </tr>
            )}
          </tbody>
          {activeDeals.length > 0 && (
            <tfoot>
              <tr className="border-t">
                <td colSpan={3} className="py-2 pr-2 text-sm font-semibold text-gray-500">
                  Active totals ({activeDeals.length})
                </td>
                <td className="py-2 pr-2 text-right font-bold text-gray-900">{formatCurrency(totalsMrr)}/mo</td>
                <td colSpan={2} />
                <td className="py-2 pr-2 text-right font-bold text-gray-900">{formatCurrency(totalsTcv)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Log activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-base font-bold text-gray-900 mb-3">Log Activity</h3>
        <div className="flex items-end gap-2 flex-wrap">
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Type</span>
            <select
              value={actType}
              onChange={(e) => setActType(e.target.value)}
              className="mt-1 block border border-gray-300 rounded-lg px-2 py-1.5 text-base"
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="block grow min-w-[220px]">
            <span className="text-sm font-semibold text-gray-700">Notes</span>
            <input
              value={actNotes}
              onChange={(e) => setActNotes(e.target.value)}
              placeholder="What happened?"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-1.5 text-base"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Follow-up Date</span>
            <input
              type="date"
              value={actFollowUpDate}
              onChange={(e) => setActFollowUpDate(e.target.value)}
              className="mt-1 block border border-gray-300 rounded-lg px-2 py-1.5 text-base"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Time</span>
            <input
              type="time"
              value={actFollowUpTime}
              onChange={(e) => setActFollowUpTime(e.target.value)}
              disabled={!actFollowUpDate}
              className="mt-1 block border border-gray-300 rounded-lg px-2 py-1.5 text-base disabled:bg-gray-100"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Assigned To</span>
            <select
              value={actOwner}
              onChange={(e) => setActOwner(e.target.value)}
              className="mt-1 block border border-gray-300 rounded-lg px-2 py-1.5 text-base"
            >
              {reps.map((r) => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </label>
          <button
            onClick={handleLogActivity}
            disabled={actSaving}
            className="px-4 py-2 rounded-lg bg-brand-orange text-white text-base font-semibold hover:bg-brand-orange/90 disabled:opacity-50"
          >
            {actSaving ? 'Saving…' : 'Log'}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          A follow-up date schedules a pending reminder (default 7:00 AM CT). Without one, the activity is logged as completed.
        </p>
      </div>

      {/* Activity timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-base font-bold text-gray-900 mb-3">Activity Timeline ({activities.length})</h3>
        {activities.length === 0 ? (
          <p className="text-base text-gray-500">No activity logged yet.</p>
        ) : (
          <ul className="space-y-3">
            {activities.map((a) => (
              <li key={a.id} className="flex items-start gap-3 border-b last:border-0 pb-3 last:pb-0">
                <span
                  className={`shrink-0 mt-0.5 inline-block px-2 py-0.5 rounded-full border text-sm font-semibold ${
                    a.status === 'Pending'
                      ? 'bg-amber-100 text-amber-900 border-amber-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  {a.activityType}
                </span>
                <div className="min-w-0">
                  <p className="text-base text-gray-800">{a.notes || <span className="text-gray-400">No notes</span>}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {a.assignedTo ?? '—'} · {formatDateTime(a.createdAt)}
                    {a.followUpAt && (
                      <>
                        {' '}· Follow-up {formatDateTime(a.followUpAt)}{' '}
                        {a.status === 'Pending' ? (
                          <button
                            onClick={() => crmPost(`/api/admin/crm/activities/${a.id}/complete`).then(load)}
                            className="text-emerald-700 font-semibold hover:underline"
                          >
                            Mark Done
                          </button>
                        ) : (
                          <span className="text-emerald-700">done</span>
                        )}
                      </>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-base text-red-600">{error}</p>}

      {showAddDeal && (
        <CrmDealDialog
          lead={{ id: lead.id, companyName: lead.companyName, region: lead.region, assignedTo: lead.assignedTo }}
          reps={reps}
          onClose={() => setShowAddDeal(false)}
          onSaved={load}
        />
      )}
      {editDeal && (
        <CrmDealDialog
          deal={editDeal}
          lead={{ id: lead.id, companyName: lead.companyName }}
          reps={reps}
          onClose={() => setEditDeal(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}
