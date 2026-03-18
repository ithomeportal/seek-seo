'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { quoteSchema, type QuoteFormData } from '@/lib/validators'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type FormErrors = Partial<Record<keyof QuoteFormData, string>>

const trailerTypeOptions = [
  { value: '', label: 'Select equipment type' },
  { value: 'sand-chassis', label: 'Sand Chassis' },
  { value: 'belly-dump', label: 'Belly Dumps' },
  { value: 'sand-hopper', label: 'Sand Hoppers' },
  { value: 'dryvan', label: 'Dry Vans' },
  { value: 'flatbed', label: 'Flat Beds' },
  { value: 'tanker', label: 'Tanks' },
  { value: 'multiple', label: 'Multiple Types' },
  { value: 'not-sure', label: 'Not Sure - Need Consultation' },
]

const durationOptions = [
  { value: '', label: 'Select duration' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: '6-month', label: '6 Month' },
  { value: '12-month', label: '12 Month' },
  { value: 'custom', label: 'Custom' },
]

const initialFormData = {
  name: '',
  email: '',
  phone: '',
  company: '',
  trailerType: '' as QuoteFormData['trailerType'],
  quantity: 1,
  duration: '' as QuoteFormData['duration'],
  startDate: '',
  details: '',
  honeypot: '',
}

export function QuoteForm() {
  const [formData, setFormData] = useState(initialFormData)
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [serverMessage, setServerMessage] = useState('')

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    const parsed = name === 'quantity' ? Number(value) : value
    setFormData((prev) => ({ ...prev, [name]: parsed }))
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setServerMessage('')

    const result = quoteSchema.safeParse(formData)
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
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      })

      if (!response.ok) {
        throw new Error('Failed to submit form')
      }

      setStatus('success')
      setServerMessage('Thank you! We will prepare your quote and get back to you within 24 hours.')
      setFormData(initialFormData)
    } catch {
      setStatus('error')
      setServerMessage('Something went wrong. Please try again or call us directly.')
    }
  }

  const inputClasses =
    'w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue focus:outline-none transition-colors'

  const selectClasses =
    'w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 bg-white focus:border-brand-blue focus:ring-2 focus:ring-brand-blue focus:outline-none transition-colors'

  if (status === 'success') {
    return (
      <div className="text-center py-16">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        <h3 className="mt-6 text-2xl font-bold text-gray-900">Quote Requested!</h3>
        <p className="mt-2 text-gray-600">Thank you! We will prepare your quote and get back to you within 24 hours.</p>
        <button
          type="button"
          onClick={() => { setStatus('idle'); setServerMessage('') }}
          className="mt-6 text-brand-blue font-semibold hover:text-brand-blue-dark transition-colors"
        >
          Send Another Request
        </button>
      </div>
    )
  }

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
          <label htmlFor="quote-name" className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="quote-name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={cn(inputClasses, errors.name && 'border-red-500 focus:ring-red-500')}
            placeholder="Your name"
          />
          {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="quote-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="quote-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={cn(inputClasses, errors.email && 'border-red-500 focus:ring-red-500')}
            placeholder="you@company.com"
          />
          {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="quote-phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            id="quote-phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={cn(inputClasses, errors.phone && 'border-red-500 focus:ring-red-500')}
            placeholder="(555) 123-4567"
          />
          {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="quote-company" className="block text-sm font-medium text-gray-700 mb-1">
            Company <span className="text-red-500">*</span>
          </label>
          <input
            id="quote-company"
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className={cn(inputClasses, errors.company && 'border-red-500 focus:ring-red-500')}
            placeholder="Your company"
          />
          {errors.company && <p className="mt-1 text-sm text-red-500">{errors.company}</p>}
        </div>

        <div>
          <label htmlFor="quote-trailerType" className="block text-sm font-medium text-gray-700 mb-1">
            Equipment Type <span className="text-red-500">*</span>
          </label>
          <select
            id="quote-trailerType"
            name="trailerType"
            value={formData.trailerType}
            onChange={handleChange}
            className={cn(selectClasses, errors.trailerType && 'border-red-500 focus:ring-red-500')}
          >
            {trailerTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.trailerType && <p className="mt-1 text-sm text-red-500">{errors.trailerType}</p>}
        </div>

        <div>
          <label htmlFor="quote-quantity" className="block text-sm font-medium text-gray-700 mb-1">
            Quantity <span className="text-red-500">*</span>
          </label>
          <input
            id="quote-quantity"
            type="number"
            name="quantity"
            min={1}
            max={100}
            value={formData.quantity}
            onChange={handleChange}
            className={cn(inputClasses, errors.quantity && 'border-red-500 focus:ring-red-500')}
          />
          {errors.quantity && <p className="mt-1 text-sm text-red-500">{errors.quantity}</p>}
        </div>

        <div>
          <label htmlFor="quote-duration" className="block text-sm font-medium text-gray-700 mb-1">
            Duration <span className="text-red-500">*</span>
          </label>
          <select
            id="quote-duration"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            className={cn(selectClasses, errors.duration && 'border-red-500 focus:ring-red-500')}
          >
            {durationOptions.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.duration && <p className="mt-1 text-sm text-red-500">{errors.duration}</p>}
        </div>

        <div>
          <label htmlFor="quote-startDate" className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            id="quote-startDate"
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className={inputClasses}
          />
        </div>
      </div>

      <div>
        <label htmlFor="quote-details" className="block text-sm font-medium text-gray-700 mb-1">
          Additional Details
        </label>
        <textarea
          id="quote-details"
          name="details"
          rows={4}
          value={formData.details}
          onChange={handleChange}
          className={inputClasses}
          placeholder="Any specific requirements or questions?"
        />
      </div>

      {serverMessage && status === 'error' && (
        <div className="rounded-lg px-4 py-3 text-sm font-medium bg-red-50 text-red-800">
          {serverMessage}
        </div>
      )}

      <Button type="submit" variant="primary" size="lg" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Submitting...' : 'Request a Quote'}
      </Button>
    </form>
  )
}
