import { NextResponse } from 'next/server'
import { z } from 'zod'
import { query } from '@/lib/db'
import { LEAD_STATUSES, REOPEN_DEFAULT_LEAD_STATUS } from '@/lib/crm'

const reopenSchema = z.object({
  nextStatus: z.enum(LEAD_STATUSES).default(REOPEN_DEFAULT_LEAD_STATUS),
})

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const leadId = Number(id)
  if (!Number.isInteger(leadId) || leadId <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 })
  }

  let body: unknown = {}
  try {
    body = await request.json()
  } catch {
    // empty body is fine — defaults apply
  }

  const parsed = reopenSchema.safeParse(body ?? {})
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
  }

  try {
    const result = await query(
      `UPDATE crm_leads SET status = $1, is_archived = FALSE, updated_at = NOW() WHERE id = $2`,
      [parsed.data.nextStatus, leadId]
    )
    if ((result.rowCount ?? 0) === 0) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('CRM lead reopen error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ success: false, error: 'Failed to reopen lead' }, { status: 500 })
  }
}
