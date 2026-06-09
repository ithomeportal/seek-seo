'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  FileSignature,
  IdCard,
  Landmark,
  Loader2,
  ShieldCheck,
  User,
} from 'lucide-react'
import { COMPANY } from '@/lib/constants'
import type { CoiDocument } from '@/lib/onboarding'
import { UploadButton } from '@/lib/uploadthing'
import { cn } from '@/lib/utils'
import { AchForm } from '@/components/portal/onboarding/AchForm'
import { CoiUpload } from '@/components/portal/onboarding/DocumentUpload'
import { LeaseGuarantyForm } from '@/components/portal/onboarding/LeaseGuarantyForm'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type Status =
  | 'created'
  | 'dl_submitted'
  | 'approved'
  | 'declined'
  | 'bundle_started'
  | 'completed'

interface Application {
  id: number
  reference: string
  status: Status
  companyName: string | null
  contactFirstName: string | null
  contactLastName: string | null
  phone: string | null
  dlUploadedAt: string | null
  dlFilename: string | null
  achAuthorizedAt: string | null
  achVoidedCheckUrl: string | null
  achVoidedCheckUploadedAt: string | null
  leaseSignedAt: string | null
  guarantySignedAt: string | null
  coiDocuments: CoiDocument[]
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

interface MeResponse {
  email: string
  customer: { contactFirstName: string | null; contactLastName: string | null } | null
}

type SectionKey = 'dl' | 'ach' | 'lease' | 'coi' | 'profile'

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function splitFullName(fullName: string): { first: string; last: string } {
  const trimmed = fullName.trim().replace(/\s+/g, ' ')
  const spaceIdx = trimmed.indexOf(' ')
  if (spaceIdx === -1) return { first: trimmed, last: '' }
  return { first: trimmed.slice(0, spaceIdx), last: trimmed.slice(spaceIdx + 1) }
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 bg-red-50 text-red-700 rounded-lg p-3 text-sm">
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Basic Info (Full Name / Phone / Company)                          */
/* ------------------------------------------------------------------ */

function BasicInfoForm({
  app,
  onSaved,
  heading = 'Tell us about yourself',
  submitLabel = 'Continue',
}: {
  app: Application | null
  onSaved: () => Promise<void>
  heading?: string
  submitLabel?: string
}) {
  const [fullName, setFullName] = useState(
    [app?.contactFirstName, app?.contactLastName].filter(Boolean).join(' ')
  )
  const [phone, setPhone] = useState(app?.phone ?? '')
  const [company, setCompany] = useState(app?.companyName ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const { first, last } = splitFullName(fullName)
    if (!first) {
      setError('Please enter your full name.')
      return
    }
    if (!company.trim()) {
      setError('Please enter your company name.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/portal/application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: company.trim(),
          contactFirstName: first,
          contactLastName: last || first,
          phone: phone.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.message || 'Could not save your information. Please try again.')
        return
      }
      await onSaved()
    } catch {
      setError('Unable to connect. Please try again later.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">{heading}</h3>
      {error && <ErrorBanner message={error} />}

      <div>
        <label htmlFor="ob-name" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          id="ob-name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          autoComplete="name"
          placeholder="John Smith"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue"
        />
      </div>

      <div>
        <label htmlFor="ob-phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <input
          id="ob-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          placeholder="(210) 555-0100"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue"
        />
      </div>

      <div>
        <label htmlFor="ob-company" className="block text-sm font-medium text-gray-700 mb-1">
          Company <span className="text-red-500">*</span>
        </label>
        <input
          id="ob-company"
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          required
          autoComplete="organization"
          placeholder="Your company name"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
      >
        {saving ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}

/* ------------------------------------------------------------------ */
/*  Section: Driver's License                                         */
/* ------------------------------------------------------------------ */

function DriversLicenseSection({
  app,
  onChanged,
}: {
  app: Application
  onChanged: () => Promise<void>
}) {
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Driver&apos;s License</h3>
      <p className="text-sm text-gray-600">
        Upload a clear photo of the front of your valid driver&apos;s license. Supported
        formats: JPG, PNG, PDF (max 8 MB).
      </p>

      {app.dlUploadedAt && (
        <div className="flex items-start gap-2 bg-green-50 text-green-800 rounded-lg p-3 text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Driver&apos;s license received</p>
            <p className="text-xs">
              Uploaded {formatDate(app.dlUploadedAt)}
              {app.dlFilename ? ` • ${app.dlFilename}` : ''}
              {' — you can upload a new file below to replace it.'}
            </p>
          </div>
        </div>
      )}

      {error && <ErrorBanner message={error} />}

      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
        <IdCard className="h-10 w-10 text-gray-400 mx-auto mb-3" />
        <UploadButton
          endpoint="customerDriversLicense"
          onUploadBegin={() => {
            setUploading(true)
            setError('')
          }}
          onClientUploadComplete={async (res) => {
            try {
              const file = res?.[0]
              if (!file) return
              const r = await fetch('/api/portal/application/dl', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: file.ufsUrl, filename: file.name }),
              })
              const data = await r.json()
              if (!r.ok || !data.success) {
                setError(data.message || 'Could not save the upload')
                return
              }
              await onChanged()
            } finally {
              setUploading(false)
            }
          }}
          onUploadError={(err: Error) => {
            setError(`Upload failed: ${err.message}`)
            setUploading(false)
          }}
          appearance={{
            button:
              'bg-brand-orange text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-brand-orange/90',
            allowedContent: 'text-xs text-gray-500 mt-2',
          }}
        />
        {uploading && (
          <p className="text-xs text-gray-500 mt-3">
            <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> Uploading…
          </p>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Your driver&apos;s license is stored securely and used only to verify your identity for
        this application.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Section: Insurance / COI                                          */
/* ------------------------------------------------------------------ */

function CoiSection({
  app,
  onChanged,
}: {
  app: Application
  onChanged: () => Promise<void>
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Insurance / COI</h3>
      <p className="text-sm text-gray-600">
        Upload your Certificate of Insurance (COI). You can add more than one file if your
        coverage spans multiple certificates. Accepted formats: JPG, PNG, PDF.
      </p>
      <CoiUpload documents={app.coiDocuments} onChanged={onChanged} />
      <p className="text-xs text-gray-500">
        SEEK Equipment Rental must be named as an additional insured and loss payee. Questions
        about coverage requirements? Call{' '}
        <a href={COMPANY.phoneHref} className="font-medium text-brand-blue hover:underline">
          {COMPANY.phone}
        </a>
        .
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Section: Profile                                                  */
/* ------------------------------------------------------------------ */

function ProfileSection({
  app,
  email,
  onSaved,
}: {
  app: Application
  email: string
  onSaved: () => Promise<void>
}) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <BasicInfoForm
        app={app}
        heading="Update your information"
        submitLabel="Save changes"
        onSaved={async () => {
          await onSaved()
          setEditing(false)
        }}
      />
    )
  }

  const rows: { label: string; value: string }[] = [
    { label: 'Email', value: email },
    {
      label: 'Full Name',
      value: [app.contactFirstName, app.contactLastName].filter(Boolean).join(' ') || '—',
    },
    { label: 'Phone', value: app.phone ?? '—' },
    { label: 'Company', value: app.companyName ?? '—' },
    { label: 'Application Started', value: formatDate(app.createdAt) },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-3 text-sm">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0"
          >
            <span className="text-gray-500">{row.label}</span>
            <span className="text-gray-900 font-medium">{row.value}</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-sm text-brand-blue font-medium hover:underline"
      >
        Edit information
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Document Menu (dark sidebar + content pane)                       */
/* ------------------------------------------------------------------ */

const SECTIONS: {
  key: SectionKey
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { key: 'dl', label: "DRIVER'S LICENSE", icon: IdCard },
  { key: 'ach', label: 'ACH', icon: Landmark },
  { key: 'lease', label: 'LEASE AGREEMENT & GUARANTY TO PAY', icon: FileSignature },
  { key: 'coi', label: 'INSURANCE / COI', icon: ShieldCheck },
]

function sectionDone(app: Application, key: SectionKey): boolean {
  if (key === 'dl') return app.progress.dl
  if (key === 'ach') return app.progress.ach
  if (key === 'lease') return app.progress.lease
  if (key === 'coi') return app.progress.coi
  return false
}

function OnboardingMenu({
  app,
  email,
  refresh,
}: {
  app: Application
  email: string
  refresh: () => Promise<void>
}) {
  const [active, setActive] = useState<SectionKey>(() => {
    if (!app.progress.dl) return 'dl'
    if (!app.progress.ach) return 'ach'
    if (!app.progress.lease) return 'lease'
    if (!app.progress.coi) return 'coi'
    return 'profile'
  })

  const navItem = (
    key: SectionKey,
    label: string,
    Icon: React.ComponentType<{ className?: string }>
  ) => {
    const done = sectionDone(app, key)
    return (
      <button
        key={key}
        type="button"
        onClick={() => setActive(key)}
        className={cn(
          'w-full flex items-start gap-2.5 text-left px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-colors',
          active === key
            ? 'bg-brand-orange text-white'
            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
        )}
      >
        <Icon className="h-4 w-4 shrink-0 mt-0.5" />
        <span className="flex-1">{label}</span>
        {done && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400 mt-0.5" />}
      </button>
    )
  }

  return (
    <div className="space-y-6">
      {app.progress.isComplete ? (
        <div className="flex items-start gap-2 bg-green-50 text-green-800 rounded-xl border border-green-200 p-4 text-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">All documents submitted — thank you!</p>
            <p>
              SEEK Equipment will review your information and reach out to finish setting up
              your account. Questions? Call{' '}
              <a href={COMPANY.phoneHref} className="font-medium underline">
                {COMPANY.phone}
              </a>
              .
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-900">Complete your account setup</h2>
            <p className="text-sm text-gray-500">
              Submit the documents below to activate your SEEK Equipment account.
            </p>
          </div>
          <span className="shrink-0 text-sm font-semibold text-brand-orange">
            {app.progress.completed}/{app.progress.total} done
          </span>
        </div>
      )}

      {/* Grid (not flex-col + lg:flex-row): @uploadthing/react/styles.css ships an
          unlayered .flex-col that beats Tailwind's layered responsive overrides. */}
      <div className="grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-6 items-start">
        {/* Sidebar — Bruno's mock: dark menu, Profile pinned at the bottom */}
        <aside className="w-full bg-gray-900 rounded-2xl p-4 flex flex-col gap-1.5 lg:min-h-[480px] lg:sticky lg:top-20">
          {SECTIONS.map((s) => navItem(s.key, s.label, s.icon))}
          <div className="lg:mt-auto pt-4 lg:border-t lg:border-gray-700">
            {navItem('profile', 'Profile', User)}
          </div>
        </aside>

        {/* Content pane */}
        <div className="min-w-0 bg-white rounded-2xl border shadow-sm p-6">
          {active === 'dl' && <DriversLicenseSection app={app} onChanged={refresh} />}
          {active === 'ach' && (
            <AchForm
              completedAt={app.achAuthorizedAt}
              voidedCheckUrl={app.achVoidedCheckUrl}
              voidedCheckUploadedAt={app.achVoidedCheckUploadedAt}
              onDone={refresh}
            />
          )}
          {active === 'lease' && (
            <LeaseGuarantyForm
              completedAt={app.leaseSignedAt}
              defaults={{ companyName: app.companyName, email }}
              onDone={refresh}
            />
          )}
          {active === 'coi' && <CoiSection app={app} onChanged={refresh} />}
          {active === 'profile' && (
            <ProfileSection app={app} email={email} onSaved={refresh} />
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Root                                                              */
/* ------------------------------------------------------------------ */

export default function OnboardingFlow({ me }: { me: MeResponse }) {
  const [app, setApp] = useState<Application | null>(null)
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/portal/application', { cache: 'no-store' })
      const data = await res.json()
      setApp(data.success ? data.application : null)
    } catch {
      setApp(null)
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
      </div>
    )
  }

  if (!app || !app.companyName) {
    return (
      <div className="max-w-md mx-auto">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome to SEEK Equipment</h2>
          <p className="text-sm text-gray-600">
            Signed in as <span className="font-medium text-gray-800">{me.email}</span>. Let&apos;s
            get your account set up.
          </p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <BasicInfoForm app={app} onSaved={refresh} />
        </div>
      </div>
    )
  }

  return <OnboardingMenu app={app} email={me.email} refresh={refresh} />
}
