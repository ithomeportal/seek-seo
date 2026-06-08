'use client'

import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export const inputClasses =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:outline-none transition-colors'

export const labelClasses = 'block text-sm font-medium text-gray-700 mb-1'

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 bg-red-50 text-red-700 rounded-lg p-3 text-sm">
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  )
}

export function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className={labelClasses}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function TextInput({
  value,
  onChange,
  error,
  ...rest
}: {
  value: string
  onChange: (v: string) => void
  error?: boolean
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <input
      {...rest}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(inputClasses, error && 'border-red-500')}
    />
  )
}

export function CompletedBanner({
  title,
  completedAt,
}: {
  title: string
  completedAt: string
}) {
  const when = (() => {
    const d = new Date(completedAt)
    return Number.isNaN(d.getTime())
      ? ''
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  })()
  return (
    <div className="flex items-start gap-2 bg-green-50 text-green-800 rounded-lg p-4 text-sm">
      <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold">{title} — signed</p>
        <p className="text-xs">
          Submitted {when}. A signed copy was emailed to you and to SEEK Equipment.
        </p>
      </div>
    </div>
  )
}

/** Honeypot field — bots fill it, humans never see it. */
export function Honeypot({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <input
      type="text"
      name="company_website"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      className="absolute left-[-9999px] h-0 w-0 opacity-0"
    />
  )
}
