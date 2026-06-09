'use client'

import { useState } from 'react'
import { CheckCircle2, FileText, Loader2, Trash2, Upload } from 'lucide-react'
import { UploadButton } from '@/lib/uploadthing'
import type { CoiDocument } from '@/lib/onboarding'
import { ErrorBanner } from './FormControls'

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/* ------------------------------------------------------------------ */
/*  Voided check / deposit slip — single file under the ACH section   */
/* ------------------------------------------------------------------ */

export function VoidedCheckUpload({
  url,
  uploadedAt,
  onChanged,
}: {
  url: string | null
  uploadedAt: string | null
  onChanged: () => Promise<void>
}) {
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">
            Voided Check / Checking Account Deposit Slip{' '}
            <span className="text-red-500">*</span>
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Required to confirm your bank account. Accepted: PDF, JPG, PNG (max 8 MB).
          </p>
        </div>
        {url && <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />}
      </div>

      {url && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 text-green-800 px-3 py-2 text-xs">
          <FileText className="h-4 w-4 shrink-0" />
          <span className="flex-1 min-w-0 truncate">
            File received{uploadedAt ? ` • ${formatDate(uploadedAt)}` : ''}
          </span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline shrink-0"
          >
            View
          </a>
        </div>
      )}

      {error && <ErrorBanner message={error} />}

      <UploadButton
        endpoint="customerVoidedCheck"
        onUploadBegin={() => {
          setUploading(true)
          setError('')
        }}
        onClientUploadComplete={async (res) => {
          try {
            const file = res?.[0]
            if (!file) return
            const r = await fetch('/api/portal/application/ach-voided-check', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: file.ufsUrl, filename: file.name }),
            })
            const data = await r.json()
            if (!r.ok || !data.success) {
              setError(data.message || 'Could not save the upload.')
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
            'bg-brand-orange text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-brand-orange/90 ut-uploading:cursor-not-allowed',
          allowedContent: 'text-xs text-gray-500 mt-1.5',
        }}
        content={{ button: url ? 'Replace file' : 'Upload file' }}
      />
      {uploading && (
        <p className="text-xs text-gray-500">
          <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> Uploading…
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Insurance / COI — multiple files                                  */
/* ------------------------------------------------------------------ */

export function CoiUpload({
  documents,
  onChanged,
}: {
  documents: CoiDocument[]
  onChanged: () => Promise<void>
}) {
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  async function remove(url: string) {
    setRemoving(url)
    setError('')
    try {
      const r = await fetch('/api/portal/application/coi', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await r.json()
      if (!r.ok || !data.success) {
        setError(data.message || 'Could not remove the file.')
        return
      }
      await onChanged()
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="space-y-4">
      {documents.length > 0 && (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.url}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <FileText className="h-4 w-4 shrink-0 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-gray-800">{doc.filename || 'Certificate of Insurance'}</p>
                {doc.uploadedAt && (
                  <p className="text-[11px] text-gray-400">Uploaded {formatDate(doc.uploadedAt)}</p>
                )}
              </div>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-blue hover:underline text-xs font-medium shrink-0"
              >
                View
              </a>
              <button
                type="button"
                onClick={() => remove(doc.url)}
                disabled={removing === doc.url}
                className="text-gray-400 hover:text-red-600 shrink-0 disabled:opacity-50"
                aria-label="Remove file"
              >
                {removing === doc.url ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <ErrorBanner message={error} />}

      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
        <Upload className="h-9 w-9 text-gray-400 mx-auto mb-3" />
        <UploadButton
          endpoint="customerCoi"
          onUploadBegin={() => {
            setUploading(true)
            setError('')
          }}
          onClientUploadComplete={async (res) => {
            try {
              for (const file of res ?? []) {
                const r = await fetch('/api/portal/application/coi', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ url: file.ufsUrl, filename: file.name }),
                })
                const data = await r.json()
                if (!r.ok || !data.success) {
                  setError(data.message || 'Could not save one of the uploads.')
                }
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
              'bg-brand-orange text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-brand-orange/90 ut-uploading:cursor-not-allowed',
            allowedContent: 'text-xs text-gray-500 mt-2',
          }}
          content={{ button: documents.length > 0 ? 'Add another COI' : 'Upload COI' }}
        />
        {uploading && (
          <p className="text-xs text-gray-500 mt-3">
            <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> Uploading…
          </p>
        )}
      </div>
    </div>
  )
}
