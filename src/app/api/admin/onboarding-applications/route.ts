import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { rowToApplication, OnboardingApplicationRow, sectionProgress } from '@/lib/onboarding'

export async function GET() {
  const result = await query<OnboardingApplicationRow>(
    `SELECT * FROM customer_onboarding_applications
      ORDER BY
        CASE WHEN status = 'completed' THEN 1 ELSE 0 END,
        created_at DESC
      LIMIT 500`
  )

  const rows = result.rows.map((r) => {
    const app = rowToApplication(r)
    return {
      ...app,
      progress: sectionProgress(app),
    }
  })

  const summary = {
    total: rows.length,
    inProgress: rows.filter((r) => r.status !== 'completed').length,
    completed: rows.filter((r) => r.status === 'completed').length,
  }

  return NextResponse.json({ success: true, data: rows, summary })
}
