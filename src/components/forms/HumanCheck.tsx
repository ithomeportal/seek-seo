'use client'

import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Lightweight "are you human" math challenge. Fetches a server-signed sum from
 * /api/captcha, shows `a + b = ?`, and reports the token + answer up to the
 * parent form so they can be POSTed and verified server-side (see lib/captcha.ts).
 *
 * Bump `refreshKey` to load a fresh challenge (e.g. after a failed submit).
 */
export function HumanCheck({
  answer,
  onAnswerChange,
  onToken,
  error,
  refreshKey = 0,
  inputClassName,
}: {
  answer: string
  onAnswerChange: (value: string) => void
  onToken: (token: string) => void
  error?: string
  refreshKey?: number
  inputClassName?: string
}) {
  const [challenge, setChallenge] = useState<{ a: number; b: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetch('/api/captcha')
      .then((r) => r.json())
      .then((data) => {
        if (!active) return
        setChallenge({ a: data.a, b: data.b })
        onToken(data.token)
        setLoading(false)
      })
      .catch(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey])

  return (
    <div>
      <label htmlFor="human-check" className="block text-sm font-medium text-gray-700 mb-1">
        Quick check: what is{' '}
        <span className="font-bold">
          {loading || !challenge ? '…' : `${challenge.a} + ${challenge.b}`}
        </span>
        ? <span className="text-red-500">*</span>
      </label>
      <div className="flex items-center gap-2">
        <input
          id="human-check"
          type="text"
          inputMode="numeric"
          name="captchaAnswer"
          autoComplete="off"
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value.replace(/[^\d]/g, '').slice(0, 3))}
          className={cn(
            inputClassName ??
              'w-28 rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue focus:outline-none transition-colors',
            error && 'border-red-500 focus:ring-red-500'
          )}
          placeholder="?"
          aria-describedby="human-check-hint"
        />
        <span id="human-check-hint" className="text-xs text-gray-400">
          Helps us block spam.
        </span>
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  )
}
