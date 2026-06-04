import { NextResponse } from 'next/server'
import { z } from 'zod'
import { query } from '@/lib/db'
import { readPortalSession } from '@/lib/portal-auth'
import {
  getApplicationByEmail,
  maybeMarkCompleted,
  publicView,
} from '@/lib/onboarding'

const completeSchema = z.object({
  doc: z.enum(['ach', 'lease']),
})

/**
 * Marks a JotForm document section as completed for the signed-in applicant.
 * 'lease' covers the combined Lease Agreement & Guaranty to Pay section.
 */
export async function POST(request: Request) {
  const session = await readPortalSession()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Not signed in' }, { status: 401 })
  }

  const parsed = completeSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: 'Invalid document section.' },
      { status: 400 }
    )
  }

  const app = await getApplicationByEmail(session.email)
  if (!app) {
    return NextResponse.json(
      { success: false, message: 'Application not found. Please save your contact info first.' },
      { status: 400 }
    )
  }

  if (parsed.data.doc === 'ach') {
    await query(
      `UPDATE customer_onboarding_applications
          SET ach_authorized_at = COALESCE(ach_authorized_at, NOW()),
              ach_authorized_name = COALESCE(ach_authorized_name, 'Submitted via portal (JotForm)'),
              updated_at = NOW()
        WHERE id = $1`,
      [app.id]
    )
  } else {
    await query(
      `UPDATE customer_onboarding_applications
          SET lease_signed_at = COALESCE(lease_signed_at, NOW()),
              lease_signed_name = COALESCE(lease_signed_name, 'Submitted via portal (JotForm)'),
              guaranty_signed_at = COALESCE(guaranty_signed_at, NOW()),
              guaranty_signed_name = COALESCE(guaranty_signed_name, 'Submitted via portal (JotForm)'),
              updated_at = NOW()
        WHERE id = $1`,
      [app.id]
    )
  }

  const updated = await maybeMarkCompleted(session.email)
  if (!updated) {
    return NextResponse.json(
      { success: false, message: 'Application not found.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, application: publicView(updated) })
}
