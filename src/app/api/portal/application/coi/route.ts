import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { readPortalSession } from '@/lib/portal-auth'
import { getApplicationByEmail, maybeMarkCompleted, publicView } from '@/lib/onboarding'

/**
 * Certificate(s) of Insurance for the "Insurance / COI" section. Customers may
 * upload multiple files; each is appended to the coi_documents jsonb array.
 * The section is complete once at least one COI is on file.
 */
export async function POST(request: Request) {
  const session = await readPortalSession()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Not signed in' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    url?: unknown
    filename?: unknown
  }
  const url = typeof body.url === 'string' ? body.url.trim() : ''
  const filename = typeof body.filename === 'string' ? body.filename.trim() : ''
  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json(
      { success: false, message: 'A valid uploaded file URL is required.' },
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

  const entry = JSON.stringify([
    { url, filename: filename || null, uploadedAt: new Date().toISOString() },
  ])
  await query(
    `UPDATE customer_onboarding_applications
        SET coi_documents = coi_documents || $1::jsonb,
            coi_uploaded_at = COALESCE(coi_uploaded_at, NOW()),
            updated_at = NOW()
      WHERE id = $2`,
    [entry, app.id]
  )

  const updated = await maybeMarkCompleted(session.email)
  if (!updated) {
    return NextResponse.json({ success: false, message: 'Application not found.' }, { status: 500 })
  }
  return NextResponse.json({ success: true, application: publicView(updated) })
}

export async function DELETE(request: Request) {
  const session = await readPortalSession()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Not signed in' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as { url?: unknown }
  const url = typeof body.url === 'string' ? body.url.trim() : ''
  if (!url) {
    return NextResponse.json(
      { success: false, message: 'A file URL is required.' },
      { status: 400 }
    )
  }

  const app = await getApplicationByEmail(session.email)
  if (!app) {
    return NextResponse.json({ success: false, message: 'Application not found.' }, { status: 400 })
  }

  await query(
    `UPDATE customer_onboarding_applications
        SET coi_documents = COALESCE(
              (SELECT jsonb_agg(elem)
                 FROM jsonb_array_elements(coi_documents) elem
                WHERE elem->>'url' <> $1),
              '[]'::jsonb
            ),
            coi_uploaded_at = CASE
              WHEN (SELECT COUNT(*) FROM jsonb_array_elements(coi_documents) elem
                     WHERE elem->>'url' <> $1) = 0 THEN NULL
              ELSE coi_uploaded_at
            END,
            updated_at = NOW()
      WHERE id = $2`,
    [url, app.id]
  )

  const updated = await getApplicationByEmail(session.email)
  if (!updated) {
    return NextResponse.json({ success: false, message: 'Application not found.' }, { status: 500 })
  }
  return NextResponse.json({ success: true, application: publicView(updated) })
}
