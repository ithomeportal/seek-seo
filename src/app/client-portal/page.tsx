'use client'

import { useState } from 'react'
import { Lock, AlertCircle } from 'lucide-react'
import { COMPANY } from '@/lib/constants'

export default function ClientPortalPage() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('Client portal is coming soon. Please contact us at ' + COMPANY.phone + ' for account inquiries.')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="mb-8 text-center">
          <Lock className="w-12 h-12 text-brand-orange mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Client Portal</h1>
          <p className="text-gray-600">
            Access your rental agreements and account information
          </p>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Login</h2>
          <p className="text-sm text-gray-500 mb-6">
            Enter your email and verification code to access your account
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 bg-red-50 text-red-700 rounded-lg p-3 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="your@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue"
              />
            </div>

            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Verification Code
              </label>
              <input
                id="code"
                type="password"
                placeholder="Enter your verification code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              Login
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don&apos;t have a verification code? Contact SEEK Equipment at{' '}
          <a href={COMPANY.phoneHref} className="text-brand-blue font-medium">
            {COMPANY.phone}
          </a>
        </p>
      </div>
    </div>
  )
}
