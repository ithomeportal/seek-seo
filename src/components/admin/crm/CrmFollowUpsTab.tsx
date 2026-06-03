'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { followupSection, humanCountdown, type FollowupSection } from '@/lib/crm'
import { crmFetch, crmPost, formatCurrency, formatDateTime, type AlertItem, type CrmRep } from './types'

const SECTIONS: Array<{ key: FollowupSection; title: string; tone: string; badge: string }> = [
  { key: 'overdue', title: 'Overdue', tone: 'border-rose-300 bg-rose-50/60', badge: 'bg-rose-600' },
  { key: 'today', title: 'Today', tone: 'border-amber-300 bg-amber-50/60', badge: 'bg-amber-500' },
  { key: 'thisWeek', title: 'This Week', tone: 'border-blue-300 bg-blue-50/60', badge: 'bg-blue-600' },
  { key: 'upcoming', title: 'Upcoming', tone: 'border-gray-200 bg-gray-50/60', badge: 'bg-gray-500' },
]

export default function CrmFollowUpsTab() {
  const [items, setItems] = useState<AlertItem[]>([])
  const [reps, setReps] = useState<CrmRep[]>([])
  const [owner, setOwner] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async (ownerFilter: string) => {
    setLoading(true)
    setError('')
    try {
      const params = ownerFilter !== 'all' ? `?owner=${encodeURIComponent(ownerFilter)}` : ''
      const [alertData, repsData] = await Promise.all([
        crmFetch<{ items: AlertItem[] }>(`/api/admin/crm/activities/alert-center${params}`),
        crmFetch<CrmRep[]>('/api/admin/crm/reps'),
      ])
      setItems(alertData.items)
      setReps(repsData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load follow-ups')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(owner)
  }, [load, owner])

  const grouped = useMemo(() => {
    const now = new Date()
    const out: Record<FollowupSection, AlertItem[]> = { overdue: [], today: [], thisWeek: [], upcoming: [] }
    for (const item of items) {
      if (!item.followUpAt) continue
      const section = followupSection(new Date(item.followUpAt), now)
      out[section] = [...out[section], item]
    }
    for (const key of Object.keys(out) as FollowupSection[]) {
      out[key] = [...out[key]].sort(
        (a, b) => new Date(a.followUpAt ?? 0).getTime() - new Date(b.followUpAt ?? 0).getTime()
      )
    }
    return out
  }, [items])

  async function markDone(id: number) {
    setBusyId(id)
    setError('')
    try {
      await crmPost(`/api/admin/crm/activities/${id}/complete`)
      await load(owner)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to complete follow-up')
    } finally {
      setBusyId(null)
    }
  }

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading follow-ups…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-lg font-bold text-gray-900">Follow-up Inbox</h2>
        <span className="text-sm text-gray-500">{items.length} pending</span>
        <select
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          className="ml-auto border border-gray-300 rounded-lg px-2 py-1.5 text-base"
        >
          <option value="all">All Owners</option>
          {reps.map((r) => (
            <option key={r.id} value={r.name}>{r.name}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-base text-red-600">{error}</p>}

      {SECTIONS.map((section) => {
        const list = grouped[section.key]
        return (
          <div key={section.key} className={`rounded-xl border p-4 ${section.tone}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full text-white text-sm font-bold ${section.badge}`}>
                {list.length}
              </span>
              <h3 className="text-base font-bold text-gray-900">{section.title}</h3>
            </div>
            {list.length === 0 ? (
              <p className="text-base text-gray-500">Nothing here.</p>
            ) : (
              <ul className="space-y-2">
                {list.map((item) => (
                  <li
                    key={item.id}
                    className="bg-white rounded-lg border border-gray-200 px-3 py-2.5 flex items-start gap-3 flex-wrap"
                  >
                    <div className="min-w-0 grow">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-sm font-semibold text-gray-700">
                          {item.activityType}
                        </span>
                        <span className="text-base font-semibold text-gray-900">{item.companyName || '—'}</span>
                        <span className="text-sm text-gray-500">{item.valueLabel}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.assignedTo ?? '—'} · {formatDateTime(item.followUpAt)} ·{' '}
                        <span
                          className={
                            section.key === 'overdue' ? 'text-rose-600 font-semibold' : 'text-gray-600'
                          }
                        >
                          {item.followUpAt ? humanCountdown(new Date(item.followUpAt)) : ''}
                        </span>
                      </p>
                      {item.notes && <p className="text-base text-gray-700 italic mt-1">“{item.notes}”</p>}
                      {(item.monthlyValue > 0 || item.totalContract > 0) && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-semibold">{formatCurrency(item.monthlyValue)}/mo</span> · TCV{' '}
                          <span className="font-semibold">{formatCurrency(item.totalContract)}</span>
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => markDone(item.id)}
                      disabled={busyId === item.id}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {busyId === item.id ? 'Saving…' : 'Mark Done'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
