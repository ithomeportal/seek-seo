'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Lock, AlertCircle, Loader2 } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) {
      setError('Please enter an access code.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      const json = await res.json()

      if (json.valid) {
        sessionStorage.setItem('seek_admin_code', code)
        router.push('/admin/dashboard')
      } else {
        setError('Invalid access code. Please try again.')
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
            Enter your access code to continue
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border shadow-sm p-8"
        >
          <div className="w-14 h-14 rounded-full bg-brand-blue/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="h-7 w-7 text-brand-blue" />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-lg p-3 mb-4 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="mb-6">
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Access Code
            </label>
            <input
              id="code"
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter access code"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue"
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
            {submitting ? 'Verifying...' : 'Access Portal'}
          </button>

          <p className="text-center text-xs text-gray-500 mt-4">
            This portal is for authorized SEEK Equipment personnel only.
          </p>
        </form>

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
