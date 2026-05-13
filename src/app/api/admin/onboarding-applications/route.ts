import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { rowToApplication, OnboardingApplicationRow, bundleProgress } from '@/lib/onboarding'

export async function GET() {
  const result = await query<OnboardingApplicationRow>(
    `SELECT * FROM customer_onboarding_applications
      ORDER BY
        CASE status
          WHEN 'dl_submitted' THEN 0
          WHEN 'bundle_started' THEN 1
          WHEN 'approved' THEN 2
          WHEN 'created' THEN 3
          WHEN 'completed' THEN 4
          ELSE 5
        END,
        created_at DESC
      LIMIT 500`
  )

  const rows = result.rows.map((r) => {
    const app = rowToApplication(r)
    return {
      ...app,
      progress: bundleProgress(app),
    }
  })

  const summary = {
    total: rows.length,
    awaitingReview: rows.filter((r) => r.status === 'dl_submitted').length,
    approved: rows.filter((r) => r.status === 'approved' || r.status === 'bundle_started').length,
    completed: rows.filter((r) => r.status === 'completed').length,
    declined: rows.filter((r) => r.status === 'declined').length,
  }

  return NextResponse.json({ success: true, data: rows, summary })
}
