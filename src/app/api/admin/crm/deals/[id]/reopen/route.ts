import { NextResponse } from 'next/server'
import { z } from 'zod'
import { query } from '@/lib/db'
import { DEAL_STAGES, REOPEN_DEFAULT_DEAL_STAGE, STAGE_PROBABILITY } from '@/lib/crm'

const reopenSchema = z.object({
  nextStage: z.enum(DEAL_STAGES).default(REOPEN_DEFAULT_DEAL_STAGE),
})

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dealId = Number(id)
  if (!Number.isInteger(dealId) || dealId <= 0) {
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
    const probability = STAGE_PROBABILITY[parsed.data.nextStage] ?? 25
    const result = await query(
      `UPDATE crm_deals
       SET stage = $1, probability = $2, is_archived = FALSE, closed_at = NULL, updated_at = NOW()
       WHERE id = $3`,
      [parsed.data.nextStage, probability, dealId]
    )
    if ((result.rowCount ?? 0) === 0) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('CRM deal reopen error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ success: false, error: 'Failed to reopen deal' }, { status: 500 })
  }
}
