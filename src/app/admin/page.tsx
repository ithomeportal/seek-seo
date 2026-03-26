'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Mail, KeyRound, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/admin/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const json = await res.json()

      if (json.success) {
        setStep('code')
      } else {
        setError(json.message || 'Unable to send code.')
      }
    } catch {
      setError('Unable to send code. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) {
      setError('Please enter the access code.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })

      const json = await res.json()

      if (json.valid) {
        sessionStorage.setItem('seek_admin_auth', 'true')
        router.push('/admin/dashboard')
      } else {
        setError('Invalid or expired code. Please try again.')
      }
    } catch {
      setError('Unable to verify. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/images/logo/logo.png"
            alt="SEEK Equipment"
            width={160}
            height={53}
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900">Internal Portal</h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 'email'
              ? 'Enter your email to receive an access code'
              : 'Enter the 6-digit code sent to your email'}
          </p>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-8">
          <div className="w-14 h-14 rounded-full bg-brand-blue/10 flex items-center justify-center mx-auto mb-6">
            {step === 'email' ? (
              <Mail className="h-7 w-7 text-brand-blue" />
            ) : (
              <KeyRound className="h-7 w-7 text-brand-blue" />
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-lg p-3 mb-4 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleSendCode}>
              <div className="mb-6">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@seekequipment.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue"
                  autoFocus
                  disabled={submitting}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white font-semibold py-3 rounded-lg transition-colors text-base disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? 'Sending...' : 'Send Access Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode}>
              <p className="text-sm text-gray-500 text-center mb-4">
                Code sent to <span className="font-medium text-gray-700">{email}</span>
              </p>

              <div className="mb-6">
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Access Code
                </label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-center text-2xl tracking-[0.5em] font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue"
                  autoFocus
                  disabled={submitting}
                />
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Code expires in 10 minutes
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white font-semibold py-3 rounded-lg transition-colors text-base disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? 'Verifying...' : 'Access Portal'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('email')
                  setCode('')
                  setError('')
                }}
                className="w-full mt-3 flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-brand-blue transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Use a different email
              </button>
            </form>
          )}

          <p className="text-center text-xs text-gray-500 mt-6">
            This portal is for authorized SEEK Equipment personnel only.
          </p>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-brand-blue transition-colors"
          >
            &larr; Back to main site
          </Link>
        </div>
      </div>
    </div>
  )
}
