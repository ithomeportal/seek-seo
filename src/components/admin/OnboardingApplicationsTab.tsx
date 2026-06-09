'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Clock,
  Eye,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  IdCard,
  Landmark,
  FileSignature,
  ShieldCheck,
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
  achAuthorizedName: string | null
  achAuthorizedAt: string | null
  achVoidedCheckUrl: string | null
  achVoidedCheckUploadedAt: string | null
  leaseSignedAt: string | null
  leaseSignedName: string | null
  guarantySignedAt: string | null
  guarantySignedName: string | null
  coiDocuments: { url: string; filename: string | null; uploadedAt: string }[]
  coiUploadedAt: string | null
  completedAt: string | null
  createdAt: string
  progress: {
    dl: boolean
    ach: boolean
    lease: boolean
    coi: boolean
    completed: number
    total: number
    isComplete: boolean
  }
}

interface Summary {
  total: number
  inProgress: number
  completed: number
}

const STATUS_LABEL: Record<string, string> = {
  created: 'In progress',
  dl_submitted: 'In progress',
  approved: 'In progress',
  bundle_started: 'In progress',
  declined: 'Declined (legacy)',
  completed: 'Completed',
}

const STATUS_COLOR: Record<string, string> = {
  created: 'bg-amber-100 text-amber-800',
  dl_submitted: 'bg-amber-100 text-amber-800',
  approved: 'bg-amber-100 text-amber-800',
  bundle_started: 'bg-amber-100 text-amber-800',
  declined: 'bg-red-100 text-red-700',
  completed: 'bg-green-100 text-green-800',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function OnboardingApplicationsTab() {
  const [apps, setApps] = useState<OnboardingApp[]>([])
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    inProgress: 0,
    completed: 0,
  })
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [error, setError] = useState('')

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

  const filtered = apps.filter((a) => {
    if (filter === 'all') return true
    if (filter === 'completed') return a.status === 'completed'
    return a.status !== 'completed'
  })

  return (
    <>
      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <KpiCard label="Total" value={summary.total} color="bg-gray-100 text-gray-700" />
        <KpiCard
          label="In Progress"
          value={summary.inProgress}
          color="bg-amber-100 text-amber-800"
        />
        <KpiCard
          label="Completed"
          value={summary.completed}
          color="bg-green-100 text-green-800"
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
          <option value="in_progress">In progress ({summary.inProgress})</option>
          <option value="completed">Completed ({summary.completed})</option>
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
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Company / Email</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Progress</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Started</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => (
                <FragmentRow
                  key={app.id}
                  app={app}
                  isExpanded={expanded === app.id}
                  onToggle={() => setExpanded((prev) => (prev === app.id ? null : app.id))}
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
}: {
  app: OnboardingApp
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <>
      <tr
        className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={onToggle}
      >
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
          <td colSpan={5} className="px-3 py-4">
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
                <DetailRow label="Started" value={formatDate(app.createdAt)} />
              </div>

              {/* Right: document sections */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">Documents</h4>
                <DocRow
                  icon={IdCard}
                  label="Driver's License"
                  doneLabel={
                    app.dlUploadedAt ? `Uploaded ${formatDate(app.dlUploadedAt)}` : null
                  }
                  url={app.dlUrl}
                />
                <DocRow
                  icon={Landmark}
                  label="ACH Authorization"
                  doneLabel={
                    app.achAuthorizedAt
                      ? `Submitted ${formatDate(app.achAuthorizedAt)}`
                      : null
                  }
                  url={null}
                />
                <DocRow
                  icon={FileText}
                  label="Voided Check / Deposit Slip"
                  doneLabel={
                    app.achVoidedCheckUrl
                      ? `Uploaded ${formatDate(app.achVoidedCheckUploadedAt)}`
                      : null
                  }
                  url={app.achVoidedCheckUrl}
                />
                <DocRow
                  icon={FileSignature}
                  label="Lease Agreement & Guaranty"
                  doneLabel={
                    app.leaseSignedAt ? `Submitted ${formatDate(app.leaseSignedAt)}` : null
                  }
                  url={null}
                />
                <DocRow
                  icon={ShieldCheck}
                  label={`Insurance / COI${
                    app.coiDocuments.length > 1 ? ` (${app.coiDocuments.length} files)` : ''
                  }`}
                  doneLabel={
                    app.coiDocuments.length > 0
                      ? `Uploaded ${formatDate(app.coiUploadedAt)}`
                      : null
                  }
                  url={app.coiDocuments[0]?.url ?? null}
                />
                {app.coiDocuments.length > 1 && (
                  <div className="pl-6 pt-1 space-y-0.5">
                    {app.coiDocuments.slice(1).map((doc) => (
                      <a
                        key={doc.url}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-[10px] text-brand-blue hover:underline truncate"
                      >
                        {doc.filename || 'Certificate of Insurance'}
                      </a>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-gray-400 mt-2">
                  ACH and Lease are signed natively in the portal; signed PDFs are emailed to
                  SEEK on submission. Voided check and COI files are linked above.
                </p>
              </div>
            </div>

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
  doneLabel,
  url,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  doneLabel: string | null
  url: string | null
}) {
  return (
    <div className="flex items-center gap-2 py-1 text-xs border-b last:border-0">
      <Icon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-gray-700">{label}</p>
        {doneLabel ? (
          <p className="text-[10px] text-gray-500 truncate">{doneLabel}</p>
        ) : (
          <p className="text-[10px] text-gray-400 italic">Not yet submitted</p>
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
