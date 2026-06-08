'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  GUARANTY_ACKNOWLEDGMENT_INTRO,
  GUARANTY_ACKNOWLEDGMENT_ITEMS,
  GUARANTY_ACKNOWLEDGMENT_TITLE,
  GUARANTY_BLOCKS,
  GUARANTY_SUBTITLE,
  GUARANTY_TITLE,
  LEASE_BLOCKS,
  LEASE_INTRO,
  LEASE_TITLE,
} from '@/lib/legal-documents'
import { leaseAgreementSchema } from '@/lib/validators'
import { cn } from '@/lib/utils'
import { LegalDocument, ScrollableDocument } from './LegalDocument'
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

type FormState = {
  signatureName: string
  title: string
  signatureDate: string
  signatureConfirmed: boolean
  guarantorFullName: string
  homeAddress: string
  city: string
  state: string
  zip: string
  dob: string
  dlNumber: string
  dlState: string
  email: string
  phone: string
  principalLegalName: string
  dba: string
  companyAddress: string
  companyState: string
  companyZip: string
  entityType: string
  fmcsaMcDot: string
  guarantyConfirmed: boolean
  guarantySignatureName: string
  guarantyDate: string
  honeypot: string
}

export function LeaseGuarantyForm({
  completedAt,
  defaults,
  onDone,
}: {
  completedAt: string | null
  defaults: { companyName: string | null; email: string }
  onDone: () => Promise<void>
}) {
  const [form, setForm] = useState<FormState>({
    signatureName: '',
    title: '',
    signatureDate: today(),
    signatureConfirmed: false,
    guarantorFullName: '',
    homeAddress: '',
    city: '',
    state: '',
    zip: '',
    dob: '',
    dlNumber: '',
    dlState: '',
    email: defaults.email,
    phone: '',
    principalLegalName: defaults.companyName ?? '',
    dba: '',
    companyAddress: '',
    companyState: '',
    companyZip: '',
    entityType: '',
    fmcsaMcDot: '',
    guarantyConfirmed: false,
    guarantySignatureName: '',
    guarantyDate: today(),
    honeypot: '',
  })
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  if (completedAt) {
    return <CompletedBanner title="Lease Agreement & Guaranty to Pay" completedAt={completedAt} />
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    const result = leaseAgreementSchema.safeParse(form)
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
      const res = await fetch('/api/portal/application/lease', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setFormError(data.message || 'Could not submit the agreement. Please try again.')
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
    <form onSubmit={submit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Lease Agreement & Guaranty to Pay</h3>
        <p className="mt-1 text-sm text-gray-500">
          Read the agreement below, then complete the signature and personal guaranty.
        </p>
      </div>

      {/* Lease text */}
      <ScrollableDocument>
        <h4 className="mb-3 text-center text-base font-bold text-gray-900">{LEASE_TITLE}</h4>
        <LegalDocument blocks={LEASE_INTRO} />
        <LegalDocument blocks={LEASE_BLOCKS} />
      </ScrollableDocument>

      {/* Lessee signature */}
      <div className="rounded-lg border-2 border-brand-orange/30 bg-brand-orange/5 p-4 space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-wide text-gray-900">Lessee Signature</h4>
        <label className="inline-flex items-start gap-2 text-sm text-gray-900 font-medium">
          <input
            type="checkbox"
            checked={form.signatureConfirmed}
            onChange={(e) => set('signatureConfirmed', e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
          />
          Lessee accepts the Equipment Rental Agreement (electronic signature).
        </label>
        {errors.signatureConfirmed && (
          <p className="text-xs text-red-600">{errors.signatureConfirmed}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Lessee Signature — Full Name" required error={errors.signatureName}>
            <TextInput
              value={form.signatureName}
              onChange={(v) => set('signatureName', v)}
              error={!!errors.signatureName}
              placeholder="Type your full name"
            />
          </Field>
          <Field label="Title" required error={errors.title}>
            <TextInput value={form.title} onChange={(v) => set('title', v)} error={!!errors.title} />
          </Field>
          <Field label="Date" required error={errors.signatureDate}>
            <input
              type="date"
              value={form.signatureDate}
              onChange={(e) => set('signatureDate', e.target.value)}
              className={cn(inputClasses, errors.signatureDate && 'border-red-500')}
            />
          </Field>
        </div>
      </div>

      {/* Guaranty text */}
      <ScrollableDocument>
        <h4 className="text-center text-base font-bold text-gray-900">{GUARANTY_TITLE}</h4>
        <p className="mb-3 text-center text-xs text-gray-500">{GUARANTY_SUBTITLE}</p>
        <LegalDocument blocks={GUARANTY_BLOCKS} />
        <p className="mt-4 mb-2 text-sm font-bold text-gray-900">{GUARANTY_ACKNOWLEDGMENT_TITLE}</p>
        <p className="mb-2 text-sm text-gray-700">{GUARANTY_ACKNOWLEDGMENT_INTRO}</p>
        {GUARANTY_ACKNOWLEDGMENT_ITEMS.map((item) => (
          <p key={item} className="mb-2 pl-5 text-sm leading-relaxed text-gray-700">
            {item}
          </p>
        ))}
      </ScrollableDocument>

      {/* Guarantor details */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-wide text-gray-900">
          Guarantor (Individual Personally Guaranteeing)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Legal Name" required error={errors.guarantorFullName}>
            <TextInput
              value={form.guarantorFullName}
              onChange={(v) => set('guarantorFullName', v)}
              error={!!errors.guarantorFullName}
            />
          </Field>
          <Field label="Home Address" required error={errors.homeAddress}>
            <TextInput
              value={form.homeAddress}
              onChange={(v) => set('homeAddress', v)}
              error={!!errors.homeAddress}
            />
          </Field>
          <Field label="City" required error={errors.city}>
            <TextInput value={form.city} onChange={(v) => set('city', v)} error={!!errors.city} />
          </Field>
          <Field label="State" required error={errors.state}>
            <TextInput value={form.state} onChange={(v) => set('state', v)} error={!!errors.state} />
          </Field>
          <Field label="Zip" required error={errors.zip}>
            <TextInput value={form.zip} onChange={(v) => set('zip', v)} error={!!errors.zip} />
          </Field>
          <Field label="Date of Birth" required error={errors.dob}>
            <input
              type="date"
              value={form.dob}
              onChange={(e) => set('dob', e.target.value)}
              className={cn(inputClasses, errors.dob && 'border-red-500')}
            />
          </Field>
          <Field label="Driver's License #" required error={errors.dlNumber}>
            <TextInput
              value={form.dlNumber}
              onChange={(v) => set('dlNumber', v)}
              error={!!errors.dlNumber}
            />
          </Field>
          <Field label="DL State" required error={errors.dlState}>
            <TextInput
              value={form.dlState}
              onChange={(v) => set('dlState', v)}
              error={!!errors.dlState}
            />
          </Field>
          <Field label="Email" required error={errors.email}>
            <TextInput
              value={form.email}
              onChange={(v) => set('email', v)}
              error={!!errors.email}
              type="email"
            />
          </Field>
          <Field label="Phone" required error={errors.phone}>
            <TextInput
              value={form.phone}
              onChange={(v) => set('phone', v)}
              error={!!errors.phone}
              type="tel"
            />
          </Field>
        </div>
      </div>

      {/* Principal company */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-wide text-gray-900">
          Principal (Renting Company Being Guaranteed)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Company Legal Name" required error={errors.principalLegalName}>
            <TextInput
              value={form.principalLegalName}
              onChange={(v) => set('principalLegalName', v)}
              error={!!errors.principalLegalName}
            />
          </Field>
          <Field label="DBA (if any)" error={errors.dba}>
            <TextInput value={form.dba} onChange={(v) => set('dba', v)} />
          </Field>
          <Field label="Company Address" required error={errors.companyAddress}>
            <TextInput
              value={form.companyAddress}
              onChange={(v) => set('companyAddress', v)}
              error={!!errors.companyAddress}
            />
          </Field>
          <Field label="Entity Type (LLC/Corp/Sole Prop)" required error={errors.entityType}>
            <TextInput
              value={form.entityType}
              onChange={(v) => set('entityType', v)}
              error={!!errors.entityType}
            />
          </Field>
          <Field label="State" required error={errors.companyState}>
            <TextInput
              value={form.companyState}
              onChange={(v) => set('companyState', v)}
              error={!!errors.companyState}
            />
          </Field>
          <Field label="Zip" required error={errors.companyZip}>
            <TextInput
              value={form.companyZip}
              onChange={(v) => set('companyZip', v)}
              error={!!errors.companyZip}
            />
          </Field>
          <Field label="FMCSA MC/DOT #" error={errors.fmcsaMcDot}>
            <TextInput value={form.fmcsaMcDot} onChange={(v) => set('fmcsaMcDot', v)} />
          </Field>
        </div>
      </div>

      {formError && <ErrorBanner message={formError} />}

      {/* Guarantor signature */}
      <div className="rounded-lg border-2 border-brand-orange/30 bg-brand-orange/5 p-4 space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-wide text-gray-900">
          Guarantor Signature
        </h4>
        <label className="inline-flex items-start gap-2 text-sm text-gray-900 font-medium">
          <input
            type="checkbox"
            checked={form.guarantyConfirmed}
            onChange={(e) => set('guarantyConfirmed', e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
          />
          Guarantor accepts the Personal Guarantee (electronic signature).
        </label>
        {errors.guarantyConfirmed && (
          <p className="text-xs text-red-600">{errors.guarantyConfirmed}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Guarantor Signature — Full Name" required error={errors.guarantySignatureName}>
            <TextInput
              value={form.guarantySignatureName}
              onChange={(v) => set('guarantySignatureName', v)}
              error={!!errors.guarantySignatureName}
              placeholder="Type your full name"
            />
          </Field>
          <Field label="Date" required error={errors.guarantyDate}>
            <input
              type="date"
              value={form.guarantyDate}
              onChange={(e) => set('guarantyDate', e.target.value)}
              className={cn(inputClasses, errors.guarantyDate && 'border-red-500')}
            />
          </Field>
        </div>
      </div>

      <Honeypot value={form.honeypot} onChange={(v) => set('honeypot', v)} />

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit Lease Agreement & Guaranty
      </button>
    </form>
  )
}
