'use client'

import { useState } from 'react'
import {
  creditApplicationSchema,
  type CreditApplicationFormData,
} from '@/lib/validators'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type FormErrors = Partial<Record<keyof CreditApplicationFormData, string>>

const initialFormData: CreditApplicationFormData = {
  name: '',
  email: '',
  phone: '',
  company: '',
  message: '',
  honeypot: '',
}

export function CreditApplicationForm() {
  const [formData, setFormData] =
    useState<CreditApplicationFormData>(initialFormData)
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle')
  const [serverMessage, setServerMessage] = useState('')

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setServerMessage('')

    const result = creditApplicationSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: FormErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FormErrors
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message
        }
      }
      setErrors(fieldErrors)
      return
    }

    setStatus('submitting')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...result.data,
          message: `[CREDIT APPLICATION]\nCompany: ${result.data.company}\nPhone: ${result.data.phone}\n\n${result.data.message ?? 'No additional information provided.'}`,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit form')
      }

      setStatus('success')
      setServerMessage(
        'Application received! Our finance team will review your information and contact you within two business days.'
      )
      setFormData(initialFormData)
    } catch {
      setStatus('error')
      setServerMessage(
        'Something went wrong. Please try again or call us directly.'
      )
    }
  }

  const inputClasses =
    'w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue focus:outline-none transition-colors'

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Honeypot */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <input
          type="text"
          name="honeypot"
          tabIndex={-1}
          autoComplete="off"
          value={formData.honeypot}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="credit-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Contact Name <span className="text-red-500">*</span>
          </label>
          <input
            id="credit-name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={cn(
              inputClasses,
              errors.name && 'border-red-500 focus:ring-red-500'
            )}
            placeholder="John Smith"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="credit-company"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Company / Business Name <span className="text-red-500">*</span>
          </label>
          <input
            id="credit-company"
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className={cn(
              inputClasses,
              errors.company && 'border-red-500 focus:ring-red-500'
            )}
            placeholder="ABC Transport LLC"
          />
          {errors.company && (
            <p className="mt-1 text-sm text-red-500">{errors.company}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="credit-email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Business Email <span className="text-red-500">*</span>
          </label>
          <input
            id="credit-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={cn(
              inputClasses,
              errors.email && 'border-red-500 focus:ring-red-500'
            )}
            placeholder="john@company.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="credit-phone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Business Phone <span className="text-red-500">*</span>
          </label>
          <input
            id="credit-phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={cn(
              inputClasses,
              errors.phone && 'border-red-500 focus:ring-red-500'
            )}
            placeholder="(210) 555-0000"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="credit-message"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Additional Information
        </label>
        <textarea
          id="credit-message"
          name="message"
          rows={5}
          value={formData.message}
          onChange={handleChange}
          className={inputClasses}
          placeholder="Please include any relevant information such as: type of business, years in operation, estimated monthly rental volume, trade references, etc."
        />
      </div>

      {serverMessage && (
        <div
          className={cn(
            'rounded-lg px-4 py-3 text-sm font-medium',
            status === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          )}
        >
          {serverMessage}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={status === 'submitting'}
      >
        {status === 'submitting' ? 'Submitting...' : 'Submit Application'}
      </Button>
    </form>
  )
}
