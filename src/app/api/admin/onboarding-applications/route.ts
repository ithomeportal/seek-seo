import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { rowToApplication, OnboardingApplicationRow, sectionProgress } from '@/lib/onboarding'

/**
 * GET /api/admin/onboarding-applications
 *
 * `?archived=1` lists the archived rows instead of the live ones, so an
 * accidental archive is always visible and reversible rather than looking like
 * the record was destroyed.
 */
export async function GET(request: Request) {
  const showArchived = new URL(request.url).searchParams.get('archived') === '1'

  const result = await query<OnboardingApplicationRow>(
    `SELECT * FROM customer_onboarding_applications
      WHERE archived_at IS ${showArchived ? 'NOT NULL' : 'NULL'}
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

  // Counted separately so the tab can offer "Archived (n)" without a second
  // request, and so an archived row can never silently vanish from every view.
  const archivedCount = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
       FROM customer_onboarding_applications
      WHERE archived_at IS NOT NULL`
  )

  const summary = {
    total: rows.length,
    inProgress: rows.filter((r) => r.status !== 'completed').length,
    completed: rows.filter((r) => r.status === 'completed').length,
    archived: parseInt(archivedCount.rows[0]?.count ?? '0', 10),
  }

  return NextResponse.json({ success: true, data: rows, summary })
}
