'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileSignature,
  IdCard,
  Landmark,
  Loader2,
  Lock,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { COMPANY } from '@/lib/constants'
import { UploadButton } from '@/lib/uploadthing'
import { cn } from '@/lib/utils'

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
  reviewedAt: string | null
  declineReason: string | null
  achBankName: string | null
  achAccountLast4: string | null
  achAuthorizedAt: string | null
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

interface MeResponse {
  email: string
  customer: { contactFirstName: string | null; contactLastName: string | null } | null
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/* ------------------------------------------------------------------ */
/*  Step Container + Indicator                                        */
/* ------------------------------------------------------------------ */

interface StepDef {
  key: 'contact' | 'dl' | 'review' | 'ach' | 'lease' | 'guaranty' | 'done'
  label: string
  icon: React.ComponentType<{ className?: string }>
}

function StepProgress({
  steps,
  current,
  completed,
}: {
  steps: StepDef[]
  current: StepDef['key']
  completed: Set<StepDef['key']>
}) {
  return (
    <ol className="flex items-center justify-between gap-2 mb-8 overflow-x-auto">
      {steps.map((s) => {
        const isCurrent = s.key === current
        const isDone = completed.has(s.key)
        const Icon = s.icon
        return (
          <li key={s.key} className="flex flex-col items-center flex-1 min-w-0">
            <div
              className={cn(
                'h-10 w-10 rounded-full flex items-center justify-center transition-colors',
                isDone
                  ? 'bg-green-500 text-white'
                  : isCurrent
                    ? 'bg-brand-orange text-white'
                    : 'bg-gray-200 text-gray-500'
              )}
            >
              {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
            </div>
            <span
              className={cn(
                'text-[11px] mt-1.5 text-center',
                isCurrent ? 'text-brand-orange font-semibold' : 'text-gray-500'
              )}
            >
              {s.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/* ------------------------------------------------------------------ */
/*  Step 0: Contact Info                                              */
/* ------------------------------------------------------------------ */

function ContactInfoStep({
  app,
  onSaved,
}: {
  app: Application | null
  onSaved: () => Promise<void>
}) {
  const [companyName, setCompanyName] = useState(app?.companyName ?? '')
  const [firstName, setFirstName] = useState(app?.contactFirstName ?? '')
  const [lastName, setLastName] = useState(app?.contactLastName ?? '')
  const [phone, setPhone] = useState(app?.phone ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/portal/application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          contactFirstName: firstName,
          contactLastName: lastName,
          phone,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.message || 'Unable to save')
        return
      }
      await onSaved()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Tell us about your business</h3>
      <p className="text-sm text-gray-600">
        We&apos;ll use this information to set up your customer account.
      </p>
      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 rounded-lg p-3 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      <Field label="Company / DBA name" required>
        <input
          type="text"
          required
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className={inputClass}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Contact first name" required>
          <input
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Contact last name" required>
          <input
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Phone">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
        />
      </Field>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Continue
        <ChevronRight className="h-4 w-4" />
      </button>
    </form>
  )
}

/* ------------------------------------------------------------------ */
/*  Step 1: DL Upload                                                 */
/* ------------------------------------------------------------------ */

function DlUploadStep({
  app,
  onUploaded,
}: {
  app: Application
  onUploaded: () => Promise<void>
}) {
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Upload your Driver&apos;s License</h3>
      <p className="text-sm text-gray-600">
        We need a clear photo of the front of your valid driver&apos;s license to verify your
        identity. Supported formats: JPG, PNG, PDF (max 8 MB).
      </p>

      {app.dlUploadedAt && (
        <div className="flex items-start gap-2 bg-green-50 text-green-800 rounded-lg p-3 text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Driver&apos;s license received</p>
            <p className="text-xs">
              Uploaded {formatDate(app.dlUploadedAt)}
              {app.dlFilename ? ` • ${app.dlFilename}` : ''}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 rounded-lg p-3 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

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
              await onUploaded()
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
/*  Pending Review Screen                                             */
/* ------------------------------------------------------------------ */

function PendingReviewStep({ app }: { app: Application }) {
  return (
    <div className="text-center py-8 space-y-4">
      <div className="w-16 h-16 rounded-full bg-amber-100 mx-auto flex items-center justify-center">
        <Clock className="h-8 w-8 text-amber-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900">Application under review</h3>
      <p className="text-gray-600 max-w-md mx-auto">
        Thanks for submitting your driver&apos;s license. A SEEK Equipment representative is
        reviewing your application and will email you within 1 business day. There&apos;s nothing
        else for you to do right now.
      </p>
      <div className="text-sm text-gray-500">
        Reference: <span className="font-mono">{app.reference}</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Declined Screen                                                   */
/* ------------------------------------------------------------------ */

function DeclinedStep({ app }: { app: Application }) {
  return (
    <div className="text-center py-8 space-y-4">
      <div className="w-16 h-16 rounded-full bg-red-100 mx-auto flex items-center justify-center">
        <XCircle className="h-8 w-8 text-red-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900">Application declined</h3>
      <p className="text-gray-600 max-w-md mx-auto">
        After reviewing your application, SEEK Equipment is unable to approve it at this time.
      </p>
      {app.declineReason && (
        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 max-w-md mx-auto">
          <strong>Reviewer note:</strong> {app.declineReason}
        </p>
      )}
      <p className="text-sm text-gray-600 max-w-md mx-auto">
        Please contact us at{' '}
        <a href={COMPANY.phoneHref} className="text-brand-blue font-medium">
          {COMPANY.phone}
        </a>{' '}
        to discuss next steps or to revise and resubmit.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Completed Screen                                                  */
/* ------------------------------------------------------------------ */

function CompletedStep({ app }: { app: Application }) {
  return (
    <div className="text-center py-8 space-y-4">
      <div className="w-16 h-16 rounded-full bg-green-100 mx-auto flex items-center justify-center">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900">All set!</h3>
      <p className="text-gray-600 max-w-md mx-auto">
        Your onboarding is complete. A SEEK Equipment account manager will be in touch within 1
        business day to coordinate your first rental.
      </p>
      <div className="text-sm text-gray-500">
        Reference: <span className="font-mono">{app.reference}</span> • Completed{' '}
        {formatDate(app.completedAt)}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  ACH Authorization Step                                            */
/* ------------------------------------------------------------------ */

function AchStep({
  app,
  onSigned,
}: {
  app: Application
  onSigned: () => Promise<void>
}) {
  const [bankName, setBankName] = useState('')
  const [routingNumber, setRoutingNumber] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountType, setAccountType] = useState<'checking' | 'savings'>('checking')
  const [voidedCheckUrl, setVoidedCheckUrl] = useState<string | null>(null)
  const [authorizedName, setAuthorizedName] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (app.achAuthorizedAt) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
        <p className="font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> ACH Authorization signed
        </p>
        <p className="text-xs mt-1">
          Signed {formatDate(app.achAuthorizedAt)} • Bank: {app.achBankName} • Account ending in
          ****{app.achAccountLast4}
        </p>
        <a
          href="/api/portal/application/ach/pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-xs font-medium text-brand-blue hover:underline"
        >
          View signed PDF
        </a>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/portal/application/ach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName,
          routingNumber,
          accountNumber,
          accountType,
          voidedCheckUrl,
          authorizedName,
          signatureConfirmed: confirmed,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.message || 'Unable to sign')
        return
      }
      await onSigned()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">ACH Authorization</h3>
        <p className="text-sm text-gray-600">
          Provide your business bank details so we can set up automatic payments.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 rounded-lg p-3 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <Field label="Bank name" required>
        <input
          type="text"
          required
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Routing number (9 digits)" required>
          <input
            type="text"
            required
            inputMode="numeric"
            pattern="\d{9}"
            maxLength={9}
            value={routingNumber}
            onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
            className={inputClass}
          />
        </Field>
        <Field label="Account number" required>
          <input
            type="text"
            required
            inputMode="numeric"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 17))}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Account type" required>
        <select
          value={accountType}
          onChange={(e) => setAccountType(e.target.value as 'checking' | 'savings')}
          className={inputClass}
        >
          <option value="checking">Checking</option>
          <option value="savings">Savings</option>
        </select>
      </Field>

      <Field label="Voided check (optional)">
        <div className="border border-dashed border-gray-300 rounded-lg p-3">
          {voidedCheckUrl ? (
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-green-700 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Uploaded
              </span>
              <button
                type="button"
                onClick={() => setVoidedCheckUrl(null)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Remove
              </button>
            </div>
          ) : (
            <UploadButton
              endpoint="customerVoidedCheck"
              onClientUploadComplete={(res) => {
                const file = res?.[0]
                if (file) setVoidedCheckUrl(file.ufsUrl)
              }}
              onUploadError={(err: Error) => setError(`Voided check upload failed: ${err.message}`)}
              appearance={{
                button:
                  'bg-gray-100 text-gray-700 text-xs font-medium px-4 py-2 rounded hover:bg-gray-200',
                allowedContent: 'text-xs text-gray-500 mt-1',
              }}
            />
          )}
        </div>
      </Field>

      <hr />

      <p className="text-sm text-gray-600">
        Your account and routing numbers are masked to the last four digits in our records. Full
        values are used only to render the PDF emailed to you and SEEK, then discarded.
      </p>

      <Field label="Authorized signer (full legal name)" required>
        <input
          type="text"
          required
          value={authorizedName}
          onChange={(e) => setAuthorizedName(e.target.value)}
          className={inputClass}
        />
      </Field>

      <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1"
          required
        />
        <span>
          I authorize SEEK Equipment Rentals to initiate ACH debits to the account above for
          amounts due under my rental, lease, or service agreements. I confirm that I am an
          authorized signer on this account and that this electronic signature has the same
          legal force as a handwritten signature.
        </span>
      </label>

      <button
        type="submit"
        disabled={loading || !confirmed}
        className="w-full bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Sign ACH Authorization
      </button>
    </form>
  )
}

/* ------------------------------------------------------------------ */
/*  Document E-Sign Step (Lease + Guaranty share this shape)         */
/* ------------------------------------------------------------------ */

function DocumentSignStep({
  app,
  docName,
  endpoint,
  bodyParagraphs,
  signedAt,
  signedName,
  pdfUrl,
  confirmLabel,
  onSigned,
}: {
  app: Application
  docName: string
  endpoint: '/api/portal/application/lease' | '/api/portal/application/guaranty'
  bodyParagraphs: string[]
  signedAt: string | null
  signedName: string | null
  pdfUrl: string
  confirmLabel: string
  onSigned: () => Promise<void>
}) {
  const [name, setName] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (signedAt) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
        <p className="font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> {docName} signed
        </p>
        <p className="text-xs mt-1">
          Signed by {signedName} on {formatDate(signedAt)}
        </p>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-xs font-medium text-brand-blue hover:underline"
        >
          View signed PDF
        </a>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedName: name, signatureConfirmed: confirmed }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.message || 'Unable to sign')
        return
      }
      await onSigned()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{docName}</h3>
        <p className="text-sm text-gray-600">
          Review the terms below and sign electronically by typing your full legal name.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
        <strong>Note:</strong> This document uses placeholder legal text until SEEK&apos;s
        final approved template is uploaded. Reference {app.reference}.
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-72 overflow-y-auto text-sm text-gray-700 space-y-2">
        {bodyParagraphs.map((p, idx) => (
          <p key={idx}>{p}</p>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 rounded-lg p-3 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <Field label="Signature — type your full legal name" required>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={cn(inputClass, 'font-mono')}
        />
      </Field>

      <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1"
          required
        />
        <span>{confirmLabel}</span>
      </label>

      <button
        type="submit"
        disabled={loading || !confirmed}
        className="w-full bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Sign {docName}
      </button>
    </form>
  )
}

/* ------------------------------------------------------------------ */
/*  Bundle (Phase 2) — all 3 documents in one screen                  */
/* ------------------------------------------------------------------ */

function BundleStep({
  app,
  onChanged,
}: {
  app: Application
  onChanged: () => Promise<void>
}) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Document bundle</h3>
        <p className="text-sm text-gray-600">
          Complete each of the three documents below to finalize your account. Each one is
          emailed to you immediately after signing.
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
          <span>
            {app.progress.completed} of {app.progress.total} signed
          </span>
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-orange transition-all"
              style={{ width: `${(app.progress.completed / app.progress.total) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <section className="border rounded-xl p-5 bg-white shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Landmark className="h-5 w-5 text-brand-blue" />
          <h4 className="font-semibold text-gray-900">ACH Authorization</h4>
        </div>
        <AchStep app={app} onSigned={onChanged} />
      </section>

      <section className="border rounded-xl p-5 bg-white shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FileSignature className="h-5 w-5 text-brand-blue" />
          <h4 className="font-semibold text-gray-900">Equipment Rental Agreement</h4>
        </div>
        <DocumentSignStep
          app={app}
          docName="Equipment Rental Agreement"
          endpoint="/api/portal/application/lease"
          pdfUrl="/api/portal/application/lease/pdf"
          signedAt={app.leaseSignedAt}
          signedName={app.leaseSignedName}
          confirmLabel="I have read and agree to be bound by the Equipment Rental Agreement, and confirm that this electronic signature has the same legal force as a handwritten signature."
          bodyParagraphs={[
            'This Equipment Rental Agreement is entered into between SEEK Equipment Rentals (Lessor) and you (Lessee). Subject to the terms below, Lessor agrees to rent the Equipment listed on any rental order to Lessee.',
            'TERM. Each unit rental begins on the delivery date and continues month-to-month until terminated by either party on 30 days written notice.',
            'RENT AND PAYMENT. Lessee pays rent in advance on the first of each rental period. Late amounts accrue interest at the lesser of 1.5% per month or the maximum permitted by law.',
            'USE AND MAINTENANCE. Lessee uses the Equipment only in the ordinary course of business, complies with all laws and manufacturer specs, and keeps it in good operating condition.',
            'INSURANCE. Lessee maintains liability and physical damage insurance covering the Equipment, naming Lessor as additional insured and loss payee.',
            'RISK OF LOSS. From delivery until return to the Lessor yard, Lessee bears all risk of loss, theft, or damage.',
            'RETURN. Equipment is returned in the same condition received, ordinary wear and tear excepted.',
            'DEFAULT. On default, Lessor may declare amounts due, repossess the Equipment, and pursue any other remedy at law or equity.',
            'GOVERNING LAW. Texas law governs; venue is exclusively in Bexar County, Texas.',
          ]}
          onSigned={onChanged}
        />
      </section>

      <section className="border rounded-xl p-5 bg-white shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5 text-brand-blue" />
          <h4 className="font-semibold text-gray-900">Personal Guaranty</h4>
        </div>
        <DocumentSignStep
          app={app}
          docName="Personal Guaranty"
          endpoint="/api/portal/application/guaranty"
          pdfUrl="/api/portal/application/guaranty/pdf"
          signedAt={app.guarantySignedAt}
          signedName={app.guarantySignedName}
          confirmLabel="I personally guarantee the obligations of the business named above to SEEK Equipment, and confirm that this electronic signature has the same legal force as a handwritten signature."
          bodyParagraphs={[
            'For valuable consideration, the undersigned (Guarantor) absolutely, unconditionally, and irrevocably guarantees to SEEK Equipment Rentals (the Company) the full and prompt payment and performance of all obligations of the business account named above (the Debtor) to the Company.',
            'NATURE. This is a continuing guaranty of payment and performance. The Company may proceed directly against Guarantor without first proceeding against the Debtor or any collateral.',
            'WAIVER. Guarantor waives notice of acceptance, demand, presentment, protest, dishonor, and other notices, and waives any right of subrogation, contribution, or indemnification until the obligations are paid in full.',
            'AMENDMENT. The Company may extend, renew, modify the obligations, take or release collateral, or deal with the Debtor in any manner, without notice to or consent of Guarantor.',
            'CONTINUING. This guaranty remains in full force until the obligations are paid in full and is not revocable except by written notice — which does not affect existing obligations or outstanding commitments.',
            'ATTORNEY’S FEES. Guarantor pays all costs of enforcement, including reasonable attorneys’ fees.',
            'GOVERNING LAW. Texas law governs; venue is exclusively in Bexar County, Texas.',
          ]}
          onSigned={onChanged}
        />
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Field helper                                                      */
/* ------------------------------------------------------------------ */

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue'

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-brand-orange"> *</span>}
      </span>
      {children}
    </label>
  )
}

/* ------------------------------------------------------------------ */
/*  Root component                                                    */
/* ------------------------------------------------------------------ */

const STEPS: StepDef[] = [
  { key: 'contact', label: 'Info', icon: IdCard },
  { key: 'dl', label: "Driver's License", icon: IdCard },
  { key: 'review', label: 'Review', icon: Clock },
  { key: 'ach', label: 'ACH', icon: Landmark },
  { key: 'lease', label: 'Lease', icon: FileSignature },
  { key: 'guaranty', label: 'Guaranty', icon: ShieldCheck },
  { key: 'done', label: 'Done', icon: CheckCircle2 },
]

export default function OnboardingFlow({ me }: { me: MeResponse }) {
  const [app, setApp] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/portal/application', { cache: 'no-store' })
      const data = await res.json()
      setApp(data.application ?? null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
      </div>
    )
  }

  const status: Status | 'no_app' = app?.status ?? 'no_app'
  const completed = new Set<StepDef['key']>()
  let current: StepDef['key'] = 'contact'

  if (app) {
    if (app.companyName) completed.add('contact')
    if (app.dlUploadedAt) completed.add('dl')
    if (status === 'approved' || status === 'bundle_started' || status === 'completed') {
      completed.add('review')
    }
    if (app.progress.ach) completed.add('ach')
    if (app.progress.lease) completed.add('lease')
    if (app.progress.guaranty) completed.add('guaranty')
    if (status === 'completed') completed.add('done')

    if (!app.companyName) current = 'contact'
    else if (!app.dlUploadedAt) current = 'dl'
    else if (status === 'dl_submitted') current = 'review'
    else if (status === 'approved' || status === 'bundle_started') {
      if (!app.progress.ach) current = 'ach'
      else if (!app.progress.lease) current = 'lease'
      else if (!app.progress.guaranty) current = 'guaranty'
      else current = 'done'
    } else if (status === 'completed') current = 'done'
  }

  return (
    <div className="space-y-6">
      <header className="bg-gradient-to-br from-brand-orange to-brand-orange-dark text-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <Lock className="h-5 w-5" />
          <h2 className="text-xl font-bold">Customer Onboarding</h2>
        </div>
        <p className="text-sm text-white/90">
          Welcome, {me.email}. Complete the steps below to set up your SEEK Equipment account.
          Your progress is saved as you go.
        </p>
        {app && (
          <p className="text-xs text-white/80 mt-2">
            Reference: <span className="font-mono">{app.reference}</span>
          </p>
        )}
      </header>

      {status !== 'declined' && status !== 'completed' && (
        <StepProgress steps={STEPS} current={current} completed={completed} />
      )}

      <div className="bg-white rounded-xl border shadow-sm p-6">
        {(!app || !app.companyName) && <ContactInfoStep app={app} onSaved={refresh} />}
        {app && app.companyName && !app.dlUploadedAt && (
          <DlUploadStep app={app} onUploaded={refresh} />
        )}
        {app && app.status === 'dl_submitted' && <PendingReviewStep app={app} />}
        {app && (app.status === 'approved' || app.status === 'bundle_started') && (
          <BundleStep app={app} onChanged={refresh} />
        )}
        {app && app.status === 'declined' && <DeclinedStep app={app} />}
        {app && app.status === 'completed' && <CompletedStep app={app} />}
      </div>
    </div>
  )
}
