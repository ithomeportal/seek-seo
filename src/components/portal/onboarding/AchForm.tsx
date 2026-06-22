'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { ACH_BLOCKS, ACH_TITLE, COMPANY_LEGAL_NAME } from '@/lib/legal-documents'
import { achAuthorizationSchema } from '@/lib/validators'
import { cn } from '@/lib/utils'
import { LegalDocument, ScrollableDocument } from './LegalDocument'
import { SignaturePad } from './SignaturePad'
import { VoidedCheckUpload } from './DocumentUpload'
import {
  CompletedBanner,
  ErrorBanner,
  Field,
  Honeypot,
  TextInput,
  inputClasses,
} from './FormControls'

const today = () => new Date().toISOString().slice(0, 10)

type Errors = Partial<Record<string, string>>

export function AchForm({
  completedAt,
  voidedCheckUrl,
  voidedCheckUploadedAt,
  onDone,
}: {
  completedAt: string | null
  voidedCheckUrl: string | null
  voidedCheckUploadedAt: string | null
  onDone: () => Promise<void>
}) {
  const [accountType, setAccountType] = useState<'checking' | 'savings' | ''>('')
  const [bankName, setBankName] = useState('')
  const [branch, setBranch] = useState('')
  const [city, setCity] = useState('')
  const [stateField, setStateField] = useState('')
  const [zip, setZip] = useState('')
  const [routingNumber, setRoutingNumber] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [signatureConfirmed, setSignatureConfirmed] = useState(false)
  const [signatureName, setSignatureName] = useState('')
  const [signatureImage, setSignatureImage] = useState('')
  const [signatureDate, setSignatureDate] = useState(today())
  const [honeypot, setHoneypot] = useState('')

  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    const payload = {
      accountType,
      bankName,
      branch,
      city,
      state: stateField,
      zip,
      routingNumber,
      accountNumber,
      accountName,
      idNumber,
      signatureConfirmed,
      signatureName,
      signatureImage,
      signatureDate,
      honeypot,
    }
    const result = achAuthorizationSchema.safeParse(payload)
    if (!result.success) {
      const fieldErrors: Errors = {}
      for (const issue of result.error.issues) {
        const key = String(issue.path[0])
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      setFormError('Please review the highlighted fields and try again.')
      return
    }
    setErrors({})
    setSaving(true)
    try {
      const res = await fetch('/api/portal/application/ach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setFormError(data.message || 'Could not submit the authorization. Please try again.')
        return
      }
      await onDone()
    } catch {
      setFormError('Unable to connect. Please try again later.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {completedAt ? (
        <CompletedBanner title="ACH Debits Authorization" completedAt={completedAt} />
      ) : (
        <form onSubmit={submit} className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{ACH_TITLE}</h3>
        <p className="mt-1 text-sm text-gray-500">
          Authorize {COMPANY_LEGAL_NAME} to debit your bank account for rental payments.
        </p>
      </div>

      <ScrollableDocument>
        <LegalDocument blocks={ACH_BLOCKS} />
      </ScrollableDocument>

      {formError && <ErrorBanner message={formError} />}

      <div className="space-y-4">
        <Field label="Account Type" required error={errors.accountType}>
          <div className="flex flex-wrap gap-4 pt-1">
            {(['checking', 'savings'] as const).map((t) => (
              <label key={t} className="inline-flex items-center gap-2 text-sm text-gray-800">
                <input
                  type="radio"
                  name="accountType"
                  checked={accountType === t}
                  onChange={() => setAccountType(t)}
                  className="h-4 w-4 text-brand-orange focus:ring-brand-orange"
                />
                {t === 'checking' ? 'Checking Account' : 'Savings Account'}
              </label>
            ))}
          </div>
        </Field>

        <Field label="Depository (Bank) Name" required error={errors.bankName}>
          <TextInput value={bankName} onChange={setBankName} error={!!errors.bankName} placeholder="Bank name" />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Branch" error={errors.branch}>
            <TextInput value={branch} onChange={setBranch} />
          </Field>
          <Field label="City" required error={errors.city}>
            <TextInput value={city} onChange={setCity} error={!!errors.city} />
          </Field>
          <Field label="State" required error={errors.state}>
            <TextInput value={stateField} onChange={setStateField} error={!!errors.state} />
          </Field>
          <Field label="Zip" required error={errors.zip}>
            <TextInput value={zip} onChange={setZip} error={!!errors.zip} />
          </Field>
          <Field label="Routing Number" required error={errors.routingNumber}>
            <TextInput
              value={routingNumber}
              onChange={(v) => setRoutingNumber(v.replace(/\D+/g, '').slice(0, 9))}
              error={!!errors.routingNumber}
              inputMode="numeric"
              placeholder="9 digits"
            />
          </Field>
          <Field label="Account Number" required error={errors.accountNumber}>
            <TextInput
              value={accountNumber}
              onChange={(v) => setAccountNumber(v.replace(/\D+/g, '').slice(0, 17))}
              error={!!errors.accountNumber}
              inputMode="numeric"
            />
          </Field>
          <Field label="Name(s) on Account" required error={errors.accountName}>
            <TextInput value={accountName} onChange={setAccountName} error={!!errors.accountName} />
          </Field>
          <Field label="ID Number" error={errors.idNumber}>
            <TextInput value={idNumber} onChange={setIdNumber} />
          </Field>
        </div>
      </div>

      <div className="rounded-lg border-2 border-brand-orange/30 bg-brand-orange/5 p-4 space-y-4">
        <label className="inline-flex items-start gap-2 text-sm text-gray-900 font-medium">
          <input
            type="checkbox"
            checked={signatureConfirmed}
            onChange={(e) => setSignatureConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
          />
          I authorize the ACH debits described above (electronic signature).
        </label>
        {errors.signatureConfirmed && (
          <p className="text-xs text-red-600">{errors.signatureConfirmed}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Signature — Typed Full Name" required error={errors.signatureName}>
            <TextInput
              value={signatureName}
              onChange={setSignatureName}
              error={!!errors.signatureName}
              placeholder="Type your full name"
            />
          </Field>
          <Field label="Date" required error={errors.signatureDate}>
            <input
              type="date"
              value={signatureDate}
              onChange={(e) => setSignatureDate(e.target.value)}
              className={cn(inputClasses, errors.signatureDate && 'border-red-500')}
            />
          </Field>
        </div>
        <Field label="Draw Your Signature" required error={errors.signatureImage}>
          <SignaturePad value={signatureImage} onChange={setSignatureImage} error={!!errors.signatureImage} />
        </Field>
      </div>

      <Honeypot value={honeypot} onChange={setHoneypot} />

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit ACH Authorization
      </button>
        </form>
      )}

      <VoidedCheckUpload
        url={voidedCheckUrl}
        uploadedAt={voidedCheckUploadedAt}
        onChanged={onDone}
      />
    </div>
  )
}
