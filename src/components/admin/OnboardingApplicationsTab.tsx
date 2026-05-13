'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  IdCard,
  Landmark,
  ShieldCheck,
  FileSignature,
  AlertCircle,
} from 'lucide-react'

interface OnboardingApp {
  id: number
  reference: string
  email: string
  status: string
  companyName: string | null
  contactFirstName: string | null
  contactLastName: string | null
  phone: string | null
  dlUrl: string | null
  dlUploadedAt: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  declineReason: string | null
  achBankName: string | null
  achAccountLast4: string | null
  achAuthorizedAt: string | null
  achVoidedCheckUrl: string | null
  leaseSignedAt: string | null
  leaseSignedName: string | null
  guarantySignedAt: string | null
  guarantySignedName: string | null
  completedAt: string | null
  createdAt: string
  progress: {
    ach: boolean
    lease: boolean
    guaranty: boolean
    completed: number
    total: number
    isComplete: boolean
  }
}

interface Summary {
  total: number
  awaitingReview: number
  approved: number
  completed: number
  declined: number
}

const STATUS_LABEL: Record<string, string> = {
  created: 'Created',
  dl_submitted: 'Awaiting review',
  approved: 'Approved',
  declined: 'Declined',
  bundle_started: 'Bundle in progress',
  completed: 'Completed',
}

const STATUS_COLOR: Record<string, string> = {
  created: 'bg-gray-100 text-gray-700',
  dl_submitted: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-800',
  declined: 'bg-red-100 text-red-700',
  bundle_started: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function OnboardingApplicationsTab({
  adminEmail,
}: {
  adminEmail: string
}) {
  const [apps, setApps] = useState<OnboardingApp[]>([])
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    awaitingReview: 0,
    approved: 0,
    completed: 0,
    declined: 0,
  })
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [declineReason, setDeclineReason] = useState('')

  const fetchApps = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/onboarding-applications', { cache: 'no-store' })
      const data = await res.json()
      if (data.success) {
        setApps(data.data)
        setSummary(data.summary)
      } else {
        setError(data.message || 'Failed to load applications')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApps()
  }, [fetchApps])

  async function handleApprove(id: number) {
    setActionLoading(id)
    setError('')
    try {
      const res = await fetch(`/api/admin/onboarding-applications/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewedBy: adminEmail }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.message || 'Approve failed')
        return
      }
      await fetchApps()
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDecline(id: number) {
    if (!declineReason.trim()) {
      setError('Please enter a decline reason before declining.')
      return
    }
    setActionLoading(id)
    setError('')
    try {
      const res = await fetch(`/api/admin/onboarding-applications/${id}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewedBy: adminEmail, reason: declineReason.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.message || 'Decline failed')
        return
      }
      setDeclineReason('')
      await fetchApps()
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = apps.filter((a) => (filter === 'all' ? true : a.status === filter))

  return (
    <>
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        <KpiCard label="Total" value={summary.total} color="bg-gray-100 text-gray-700" />
        <KpiCard
          label="Awaiting Review"
          value={summary.awaitingReview}
          color="bg-amber-100 text-amber-800"
        />
        <KpiCard
          label="Approved"
          value={summary.approved}
          color="bg-blue-100 text-blue-800"
        />
        <KpiCard
          label="Completed"
          value={summary.completed}
          color="bg-green-100 text-green-800"
        />
        <KpiCard
          label="Declined"
          value={summary.declined}
          color="bg-red-100 text-red-800"
        />
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <label className="text-xs font-medium text-gray-600">Filter:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-xs rounded border border-gray-300 px-2 py-1 bg-white"
        >
          <option value="all">All ({apps.length})</option>
          <option value="dl_submitted">Awaiting review ({summary.awaitingReview})</option>
          <option value="approved">Approved</option>
          <option value="bundle_started">Bundle in progress</option>
          <option value="completed">Completed</option>
          <option value="declined">Declined</option>
        </select>
        <button
          onClick={fetchApps}
          className="text-xs text-brand-blue font-medium ml-auto hover:underline"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 rounded p-2.5 text-xs mb-3">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand-orange" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded border">
          <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No onboarding applications.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr className="border-b">
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Reference</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Company / Email</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Progress</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Submitted</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => (
                <FragmentRow
                  key={app.id}
                  app={app}
                  isExpanded={expanded === app.id}
                  onToggle={() => {
                    setExpanded((prev) => (prev === app.id ? null : app.id))
                    setDeclineReason('')
                    setError('')
                  }}
                  onApprove={() => handleApprove(app.id)}
                  onDecline={() => handleDecline(app.id)}
                  actionLoading={actionLoading === app.id}
                  declineReason={declineReason}
                  setDeclineReason={setDeclineReason}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function KpiCard({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div className={`rounded p-3 ${color}`}>
      <p className="text-[10px] uppercase font-semibold opacity-80">{label}</p>
      <p className="text-xl font-bold mt-0.5">{value}</p>
    </div>
  )
}

function FragmentRow({
  app,
  isExpanded,
  onToggle,
  onApprove,
  onDecline,
  actionLoading,
  declineReason,
  setDeclineReason,
}: {
  app: OnboardingApp
  isExpanded: boolean
  onToggle: () => void
  onApprove: () => void
  onDecline: () => void
  actionLoading: boolean
  declineReason: string
  setDeclineReason: (s: string) => void
}) {
  const canReview = app.status === 'dl_submitted'
  return (
    <>
      <tr
        className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-3 py-2 font-mono text-[11px]">{app.reference}</td>
        <td className="px-3 py-2">
          <p className="font-medium text-gray-900">{app.companyName || '—'}</p>
          <p className="text-[11px] text-gray-500">{app.email}</p>
        </td>
        <td className="px-3 py-2">
          <span
            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
              STATUS_COLOR[app.status] ?? 'bg-gray-100 text-gray-700'
            }`}
          >
            {STATUS_LABEL[app.status] ?? app.status}
          </span>
        </td>
        <td className="px-3 py-2 text-gray-700">
          {app.progress.completed} / {app.progress.total}
        </td>
        <td className="px-3 py-2 text-gray-500">{formatDate(app.createdAt)}</td>
        <td className="px-3 py-2 text-right">
          <button className="text-brand-blue hover:underline text-xs font-medium inline-flex items-center gap-1">
            <Eye className="h-3 w-3" />
            View
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-50/60">
          <td colSpan={6} className="px-3 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: applicant info */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">Applicant</h4>
                <DetailRow label="Email" value={app.email} />
                <DetailRow label="Company" value={app.companyName} />
                <DetailRow
                  label="Contact"
                  value={
                    [app.contactFirstName, app.contactLastName].filter(Boolean).join(' ') ||
                    null
                  }
                />
                <DetailRow label="Phone" value={app.phone} />
                <DetailRow label="Created" value={formatDate(app.createdAt)} />
              </div>

              {/* Right: documents */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">Documents</h4>
                <DocRow
                  icon={IdCard}
                  label="Driver's License"
                  signedLabel={
                    app.dlUploadedAt ? `Uploaded ${formatDate(app.dlUploadedAt)}` : null
                  }
                  url={app.dlUrl}
                />
                <DocRow
                  icon={Landmark}
                  label="ACH Authorization"
                  signedLabel={
                    app.achAuthorizedAt
                      ? `${app.achBankName} ****${app.achAccountLast4} • ${formatDate(
                          app.achAuthorizedAt
                        )}`
                      : null
                  }
                  url={
                    app.achAuthorizedAt
                      ? `/api/admin/onboarding-applications/${app.id}/pdf/ach`
                      : null
                  }
                />
                <DocRow
                  icon={FileSignature}
                  label="Equipment Rental Agreement"
                  signedLabel={
                    app.leaseSignedAt
                      ? `${app.leaseSignedName} • ${formatDate(app.leaseSignedAt)}`
                      : null
                  }
                  url={
                    app.leaseSignedAt
                      ? `/api/admin/onboarding-applications/${app.id}/pdf/lease`
                      : null
                  }
                />
                <DocRow
                  icon={ShieldCheck}
                  label="Personal Guaranty"
                  signedLabel={
                    app.guarantySignedAt
                      ? `${app.guarantySignedName} • ${formatDate(app.guarantySignedAt)}`
                      : null
                  }
                  url={
                    app.guarantySignedAt
                      ? `/api/admin/onboarding-applications/${app.id}/pdf/guaranty`
                      : null
                  }
                />
                <DocRow
                  icon={Landmark}
                  label="Voided Check"
                  signedLabel={app.achVoidedCheckUrl ? 'Uploaded' : null}
                  url={app.achVoidedCheckUrl}
                />
              </div>
            </div>

            {/* Decision panel */}
            {canReview && (
              <div className="mt-4 pt-4 border-t bg-amber-50/40 -mx-3 -mb-4 px-3 pb-4 rounded-b">
                <h4 className="text-xs font-bold text-amber-900 uppercase mb-2">
                  Review decision
                </h4>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onApprove()
                    }}
                    disabled={actionLoading}
                    className="inline-flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded transition-colors disabled:opacity-60"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    Approve & unlock document bundle
                  </button>
                  <div className="flex-1 flex gap-2 min-w-0">
                    <input
                      type="text"
                      placeholder="Decline reason (required)"
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 text-xs rounded border border-gray-300 px-2 py-1.5 min-w-0"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDecline()
                      }}
                      disabled={actionLoading || !declineReason.trim()}
                      className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors disabled:opacity-60 shrink-0"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            )}

            {app.status === 'declined' && app.declineReason && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-xs">
                <p className="font-semibold text-red-800 mb-1">Declined</p>
                <p className="text-red-700">
                  Reason: {app.declineReason} • Reviewed{' '}
                  {formatDate(app.reviewedAt)} by {app.reviewedBy ?? '—'}
                </p>
              </div>
            )}

            {app.status === 'completed' && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-xs">
                <Clock className="h-3 w-3 inline mr-1" />
                Completed {formatDate(app.completedAt)}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between py-1 text-xs border-b last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium text-right">{value ?? '—'}</span>
    </div>
  )
}

function DocRow({
  icon: Icon,
  label,
  signedLabel,
  url,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  signedLabel: string | null
  url: string | null
}) {
  return (
    <div className="flex items-center gap-2 py-1 text-xs border-b last:border-0">
      <Icon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-gray-700">{label}</p>
        {signedLabel ? (
          <p className="text-[10px] text-gray-500 truncate">{signedLabel}</p>
        ) : (
          <p className="text-[10px] text-gray-400 italic">Not yet signed</p>
        )}
      </div>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-blue hover:underline text-[10px] font-medium shrink-0"
        >
          View
        </a>
      ) : null}
    </div>
  )
}
