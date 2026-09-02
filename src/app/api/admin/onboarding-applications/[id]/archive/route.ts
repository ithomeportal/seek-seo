import { NextResponse } from 'next/server'
import { z } from 'zod'
import { query } from '@/lib/db'
import { getApplicationById, sectionProgress } from '@/lib/onboarding'

/**
 * POST /api/admin/onboarding-applications/[id]/archive
 *
 * Archives (or restores) an onboarding application. This is the admin "remove
 * this row" action — for clearing out test submissions without a developer.
 *
 * ⚠ It archives; it never deletes. Every `/api/admin/*` route in this app is
 * gated CLIENT-side only (a sessionStorage flag) — `api/admin/verify` checks
 * the OTP and issues no server-side session token to check here. A hard DELETE
 * on that surface would let anyone who knows the URL destroy signed ACH
 * authorizations and lease agreements with a single unauthenticated request.
 * The worst case of an archive is a reversible hide, and the restore path in
 * the same tab makes that recovery a two-click operation.
 *
 * Real destruction stays deliberate and operator-driven:
 * `node scripts/delete-onboarding-application.mjs <email|id> --commit`.
 */
const bodySchema = z.object({
  action: z.enum(['archive', 'restore']).default('archive'),
  /** Free text; stored so it is clear later why a row was hidden. */
  reason: z.string().trim().max(500).optional(),
  /** Who pressed the button, from the admin session in the browser. */
  actor: z.string().trim().max(200).optional(),
})

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const numericId = Number(id)
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 })
  }

  let parsed: z.infer<typeof bodySchema>
  try {
    parsed = bodySchema.parse(await request.json())
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid request body' },
      { status: 400 }
    )
  }

  const existing = await getApplicationById(numericId)
  if (!existing) {
    return NextResponse.json(
      { success: false, message: 'Application not found' },
      { status: 404 }
    )
  }

  try {
    if (parsed.action === 'archive') {
      await query(
        `UPDATE customer_onboarding_applications
            SET archived_at    = NOW(),
                archived_by    = $2,
                archive_reason = $3,
                updated_at     = NOW()
          WHERE id = $1`,
        [numericId, parsed.actor ?? null, parsed.reason ?? null]
      )
    } else {
      await query(
        `UPDATE customer_onboarding_applications
            SET archived_at    = NULL,
                archived_by    = NULL,
                archive_reason = NULL,
                updated_at     = NOW()
          WHERE id = $1`,
        [numericId]
      )
    }
  } catch (err) {
    console.error('[onboarding-archive] update failed:', err)
    return NextResponse.json(
      { success: false, message: 'Failed to update the application' },
      { status: 500 }
    )
  }

  const updated = await getApplicationById(numericId)
  return NextResponse.json({
    success: true,
    action: parsed.action,
    data: updated ? { ...updated, progress: sectionProgress(updated) } : null,
  })
}
