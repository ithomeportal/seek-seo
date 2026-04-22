'use client'

import { useState } from 'react'
import { CheckCircle2, Send } from 'lucide-react'
import {
  creditApplicationSchema,
  type CreditApplicationFormData,
} from '@/lib/validators'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type FormErrors = Partial<Record<string, string>>

const initialFormData: CreditApplicationFormData = {
  customerName: '',
  customerStreet: '',
  customerCity: '',
  customerState: '',
  customerZip: '',
  customerPhone: '',
  entityType: 'llc',
  previousBusinessName: '',
  stateEntityFormed: '',
  businessPhone: '',
  bankruptcyFiled: false,
  bankruptcyYear: '',
  federalTaxId: '',
  dnbNumber: '',
  driverLicense: '',
  partnersMembers: '',
  signatoryName: '',
  signatoryTitle: '',
  signatoryAddress: '',
  signatoryPhone: '',
  signatoryEmail: '',
  bankName: '',
  bankContactName: '',
  bankAddress: '',
  bankAccountNumber: '',
  bankTransit: '',
  jobNumbersRequired: false,
  taxExempt: false,
  insuranceCompany: '',
  insuranceContactPerson: '',
  insurancePhone: '',
  certificateForwarded: false,
  apContact: '',
  apEmail: '',
  apPhone: '',
  tradeReferences: [
    { name: '', phone: '', address: '' },
    { name: '', phone: '', address: '' },
    { name: '', phone: '', address: '' },
  ],
  signatureConfirmed: false as unknown as true, // UI defaults unchecked; Zod requires true on submit
  signatureName: '',
  signatureDate: new Date().toISOString().slice(0, 10),
  honeypot: '',
}

const inputClasses =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:outline-none transition-colors'

const labelClasses = 'block text-xs font-semibold text-gray-700 mb-1'

export function CreditApplicationForm() {
  const [formData, setFormData] = useState<CreditApplicationFormData>({
    ...initialFormData,
    signatureConfirmed: false as unknown as true,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle')
  const [serverMessage, setServerMessage] = useState('')
  const [reference, setReference] = useState<string | null>(null)

  function updateField<K extends keyof CreditApplicationFormData>(
    key: K,
    value: CreditApplicationFormData[K]
  ) {
    setFormData((prev) => ({ ...prev, [key]: value }))
    if (errors[key as string]) {
      setErrors((prev) => ({ ...prev, [key as string]: undefined }))
    }
  }

  function updateTradeReference(
    index: number,
    field: 'name' | 'phone' | 'address',
    value: string
  ) {
    const refs = [...(formData.tradeReferences ?? [])]
    refs[index] = { ...refs[index], [field]: value }
    setFormData((prev) => ({ ...prev, tradeReferences: refs }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setServerMessage('')

    const result = creditApplicationSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: FormErrors = {}
      for (const issue of result.error.issues) {
        const path = issue.path.join('.')
        if (!fieldErrors[path]) fieldErrors[path] = issue.message
      }
      setErrors(fieldErrors)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setStatus('submitting')
    try {
      const response = await fetch('/api/credit-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      })
      const json = await response.json()
      if (!response.ok || !json.success) {
        throw new Error(json.message ?? 'Failed to submit')
      }
      setReference(json.reference ?? null)
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setServerMessage(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again or call us directly.'
      )
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-12">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        <h3 className="mt-6 text-2xl font-bold text-gray-900">
          Application Presented
        </h3>
        <p className="mt-3 text-gray-600 max-w-md mx-auto">
          We will contact you as soon as possible. A copy of your application has
          been sent to your email.
        </p>
        {reference && (
          <p className="mt-4 text-sm text-gray-500">
            Reference:{' '}
            <span className="font-mono font-semibold text-brand-orange">
              {reference}
            </span>
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setStatus('idle')
            setServerMessage('')
            setReference(null)
            setFormData({
              ...initialFormData,
              signatureConfirmed: false as unknown as true,
            })
          }}
          className="mt-8 text-brand-blue font-semibold hover:underline"
        >
          Submit another application
        </button>
      </div>
    )
  }

  const fieldError = (path: string) =>
    errors[path] ? (
      <p className="mt-1 text-xs text-red-500">{errors[path]}</p>
    ) : null

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* Honeypot */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <input
          type="text"
          name="honeypot"
          tabIndex={-1}
          autoComplete="off"
          value={formData.honeypot ?? ''}
          onChange={(e) => updateField('honeypot', e.target.value)}
        />
      </div>

      {/* Top banner */}
      <div className="rounded-lg border border-brand-orange/30 bg-brand-orange/5 p-4 text-center">
        <p className="text-sm font-semibold text-gray-900">
          Application for Credit &amp; Rental Agreement
        </p>
        <p className="text-xs text-gray-600 mt-1">
          In order to process your request, this agreement must be electronically
          signed at the bottom of the form.
        </p>
      </div>

      {/* === Customer === */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 pb-2 border-b">
          Customer
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClasses}>
              Customer Name (Individual or Company){' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => updateField('customerName', e.target.value)}
              className={cn(
                inputClasses,
                errors.customerName && 'border-red-500'
              )}
            />
            {fieldError('customerName')}
          </div>
          <div className="sm:col-span-2">
            <label className={labelClasses}>Street Address</label>
            <input
              type="text"
              value={formData.customerStreet ?? ''}
              onChange={(e) => updateField('customerStreet', e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>City</label>
            <input
              type="text"
              value={formData.customerCity ?? ''}
              onChange={(e) => updateField('customerCity', e.target.value)}
              className={inputClasses}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>State</label>
              <input
                type="text"
                maxLength={2}
                value={formData.customerState ?? ''}
                onChange={(e) =>
                  updateField('customerState', e.target.value.toUpperCase())
                }
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Zip</label>
              <input
                type="text"
                value={formData.customerZip ?? ''}
                onChange={(e) => updateField('customerZip', e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClasses}>
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => updateField('customerPhone', e.target.value)}
              className={cn(
                inputClasses,
                errors.customerPhone && 'border-red-500'
              )}
              placeholder="(210) 555-0000"
            />
            {fieldError('customerPhone')}
          </div>
        </div>
      </section>

      {/* === Business === */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 pb-2 border-b">
          Business Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClasses}>
              Entity Type <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {(['corporation', 'llc', 'partnership', 'proprietorship'] as const).map(
                (type) => (
                  <label
                    key={type}
                    className={cn(
                      'inline-flex items-center gap-2 px-3 py-1.5 rounded border cursor-pointer text-sm',
                      formData.entityType === type
                        ? 'bg-brand-blue text-white border-brand-blue'
                        : 'bg-white border-gray-300 hover:border-brand-blue'
                    )}
                  >
                    <input
                      type="radio"
                      name="entityType"
                      value={type}
                      checked={formData.entityType === type}
                      onChange={() => updateField('entityType', type)}
                      className="sr-only"
                    />
                    <span className="capitalize">
                      {type === 'llc' ? 'LLC' : type}
                    </span>
                  </label>
                )
              )}
            </div>
          </div>
          <div>
            <label className={labelClasses}>Previous Business Name</label>
            <input
              type="text"
              value={formData.previousBusinessName ?? ''}
              onChange={(e) =>
                updateField('previousBusinessName', e.target.value)
              }
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>State Entity Formed</label>
            <input
              type="text"
              maxLength={2}
              value={formData.stateEntityFormed ?? ''}
              onChange={(e) =>
                updateField('stateEntityFormed', e.target.value.toUpperCase())
              }
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Business Phone</label>
            <input
              type="tel"
              value={formData.businessPhone ?? ''}
              onChange={(e) => updateField('businessPhone', e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Federal Tax ID#</label>
            <input
              type="text"
              value={formData.federalTaxId ?? ''}
              onChange={(e) => updateField('federalTaxId', e.target.value)}
              className={inputClasses}
              placeholder="XX-XXXXXXX"
            />
          </div>
          <div>
            <label className={labelClasses}>D &amp; B #</label>
            <input
              type="text"
              value={formData.dnbNumber ?? ''}
              onChange={(e) => updateField('dnbNumber', e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>
              Driver&apos;s License{' '}
              <span className="text-[10px] font-normal text-gray-400">
                (optional — last 4 stored)
              </span>
            </label>
            <input
              type="text"
              value={formData.driverLicense ?? ''}
              onChange={(e) => updateField('driverLicense', e.target.value)}
              className={inputClasses}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.bankruptcyFiled}
                onChange={(e) =>
                  updateField('bankruptcyFiled', e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
              />
              Have you ever filed bankruptcy?
            </label>
            {formData.bankruptcyFiled && (
              <input
                type="text"
                placeholder="Year (e.g. 2018)"
                value={formData.bankruptcyYear ?? ''}
                onChange={(e) => updateField('bankruptcyYear', e.target.value)}
                className={cn(inputClasses, 'mt-2 max-w-xs')}
              />
            )}
          </div>
          <div className="sm:col-span-2">
            <label className={labelClasses}>
              If Partnership or LLC, list partners / members
            </label>
            <textarea
              rows={2}
              value={formData.partnersMembers ?? ''}
              onChange={(e) => updateField('partnersMembers', e.target.value)}
              className={inputClasses}
            />
          </div>
        </div>
      </section>

      {/* === Signatory === */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 pb-2 border-b">
          Signatory (Authorized Agent)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.signatoryName}
              onChange={(e) => updateField('signatoryName', e.target.value)}
              className={cn(
                inputClasses,
                errors.signatoryName && 'border-red-500'
              )}
            />
            {fieldError('signatoryName')}
          </div>
          <div>
            <label className={labelClasses}>Title / Relationship</label>
            <input
              type="text"
              value={formData.signatoryTitle ?? ''}
              onChange={(e) => updateField('signatoryTitle', e.target.value)}
              className={inputClasses}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClasses}>Address</label>
            <input
              type="text"
              value={formData.signatoryAddress ?? ''}
              onChange={(e) => updateField('signatoryAddress', e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Phone Number</label>
            <input
              type="tel"
              value={formData.signatoryPhone ?? ''}
              onChange={(e) => updateField('signatoryPhone', e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.signatoryEmail}
              onChange={(e) => updateField('signatoryEmail', e.target.value)}
              className={cn(
                inputClasses,
                errors.signatoryEmail && 'border-red-500'
              )}
              placeholder="you@company.com"
            />
            {fieldError('signatoryEmail')}
            <p className="text-[11px] text-gray-500 mt-1">
              A copy of the submitted application will be emailed here.
            </p>
          </div>
        </div>
      </section>

      {/* === Banking === */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 pb-2 border-b">
          Banking Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>Bank Name</label>
            <input
              type="text"
              value={formData.bankName ?? ''}
              onChange={(e) => updateField('bankName', e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Contact Name</label>
            <input
              type="text"
              value={formData.bankContactName ?? ''}
              onChange={(e) => updateField('bankContactName', e.target.value)}
              className={inputClasses}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClasses}>Address</label>
            <input
              type="text"
              value={formData.bankAddress ?? ''}
              onChange={(e) => updateField('bankAddress', e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>
              Account Number{' '}
              <span className="text-[10px] font-normal text-gray-400">
                (last 4 stored)
              </span>
            </label>
            <input
              type="text"
              value={formData.bankAccountNumber ?? ''}
              onChange={(e) => updateField('bankAccountNumber', e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Bank Transit / Routing</label>
            <input
              type="text"
              value={formData.bankTransit ?? ''}
              onChange={(e) => updateField('bankTransit', e.target.value)}
              className={inputClasses}
            />
          </div>
        </div>
      </section>

      {/* === Accounting === */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 pb-2 border-b">
          Accounting Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={formData.jobNumbersRequired}
              onChange={(e) =>
                updateField('jobNumbersRequired', e.target.checked)
              }
              className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
            />
            Job #s Required
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={formData.taxExempt}
              onChange={(e) => updateField('taxExempt', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
            />
            Tax Exempt (attach proper form)
          </label>
          <div className="sm:col-span-2">
            <label className={labelClasses}>Insurance Company</label>
            <input
              type="text"
              value={formData.insuranceCompany ?? ''}
              onChange={(e) => updateField('insuranceCompany', e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Insurance Contact Person</label>
            <input
              type="text"
              value={formData.insuranceContactPerson ?? ''}
              onChange={(e) =>
                updateField('insuranceContactPerson', e.target.value)
              }
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Insurance Phone</label>
            <input
              type="tel"
              value={formData.insurancePhone ?? ''}
              onChange={(e) => updateField('insurancePhone', e.target.value)}
              className={inputClasses}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.certificateForwarded}
                onChange={(e) =>
                  updateField('certificateForwarded', e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
              />
              Certificate of Insurance being forwarded
            </label>
            <p className="text-[11px] text-gray-500 ml-6">
              An insurance certificate is required prior to rental.
            </p>
          </div>
          <div>
            <label className={labelClasses}>Accounts Payable (A/P) Contact</label>
            <input
              type="text"
              value={formData.apContact ?? ''}
              onChange={(e) => updateField('apContact', e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>A/P Email Address</label>
            <input
              type="email"
              value={formData.apEmail ?? ''}
              onChange={(e) => updateField('apEmail', e.target.value)}
              className={cn(inputClasses, errors.apEmail && 'border-red-500')}
            />
            {fieldError('apEmail')}
          </div>
          <div>
            <label className={labelClasses}>A/P Phone Number</label>
            <input
              type="tel"
              value={formData.apPhone ?? ''}
              onChange={(e) => updateField('apPhone', e.target.value)}
              className={inputClasses}
            />
          </div>
        </div>
      </section>

      {/* === Trade References === */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 pb-2 border-b">
          Trade References
        </h3>
        <div className="space-y-3">
          {(formData.tradeReferences ?? []).map((ref, i) => (
            <div
              key={i}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg border border-gray-200 bg-gray-50/60 p-3"
            >
              <input
                type="text"
                placeholder={`Reference ${i + 1} Name`}
                value={ref.name ?? ''}
                onChange={(e) =>
                  updateTradeReference(i, 'name', e.target.value)
                }
                className={inputClasses}
              />
              <input
                type="tel"
                placeholder="Phone"
                value={ref.phone ?? ''}
                onChange={(e) =>
                  updateTradeReference(i, 'phone', e.target.value)
                }
                className={inputClasses}
              />
              <input
                type="text"
                placeholder="Address"
                value={ref.address ?? ''}
                onChange={(e) =>
                  updateTradeReference(i, 'address', e.target.value)
                }
                className={inputClasses}
              />
            </div>
          ))}
        </div>
      </section>

      {/* === Signature Confirmation === */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 pb-2 border-b">
          Signature Confirmation
        </h3>
        <div className="rounded-lg border-2 border-brand-orange/30 bg-brand-orange/5 p-4 space-y-4">
          <p className="text-sm text-gray-700">
            By submitting this application online, I confirm the accuracy of all
            information above and authorize SEEK Equipment Rentals to verify the
            information and conduct a credit evaluation.
          </p>
          <label className="inline-flex items-start gap-2 text-sm text-gray-900 font-medium">
            <input
              type="checkbox"
              checked={Boolean(formData.signatureConfirmed)}
              onChange={(e) =>
                updateField(
                  'signatureConfirmed',
                  e.target.checked as unknown as true
                )
              }
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
            />
            I confirm the information above is true and accurate (electronic
            signature).
          </label>
          {fieldError('signatureConfirmed')}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>
                Applicant Signature — Typed Full Name{' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.signatureName}
                onChange={(e) => updateField('signatureName', e.target.value)}
                className={cn(
                  inputClasses,
                  errors.signatureName && 'border-red-500'
                )}
                placeholder="Type your full name"
              />
              {fieldError('signatureName')}
            </div>
            <div>
              <label className={labelClasses}>
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.signatureDate}
                onChange={(e) => updateField('signatureDate', e.target.value)}
                className={cn(
                  inputClasses,
                  errors.signatureDate && 'border-red-500'
                )}
              />
              {fieldError('signatureDate')}
            </div>
          </div>
        </div>
      </section>

      {serverMessage && status === 'error' && (
        <div className="rounded-lg px-4 py-3 text-sm font-medium bg-red-50 text-red-800">
          {serverMessage}
        </div>
      )}

      {Object.keys(errors).length > 0 && (
        <div className="rounded-lg px-4 py-3 text-sm bg-red-50 text-red-800">
          Please review the highlighted fields and try again.
        </div>
      )}

      <div className="flex items-center justify-end">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={status === 'submitting'}
        >
          {status === 'submitting' ? (
            'Submitting...'
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Application
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
