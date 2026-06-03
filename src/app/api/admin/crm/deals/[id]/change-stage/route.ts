import { NextResponse } from 'next/server'
import { z } from 'zod'
import { query } from '@/lib/db'
import { DEAL_STAGES, STAGE_PROBABILITY } from '@/lib/crm'
import { getDeal } from '@/lib/crm-db'

const changeStageSchema = z.object({ stage: z.enum(DEAL_STAGES) })

// Stage workflow. NOTE: unlike the original MANUS CRM, "Closed Won" does NOT
// auto-allocate fleet units — fleet_units (Fleet Master) is the source of truth
// and is managed manually. This route only updates the deal + its parent lead.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dealId = Number(id)
  if (!Number.isInteger(dealId) || dealId <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = changeStageSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: `stage must be one of: ${DEAL_STAGES.join(', ')}` },
      { status: 400 }
    )
  }

  const stage = parsed.data.stage
  try {
    const deal = await getDeal(dealId)
    if (!deal) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    const probability = STAGE_PROBABILITY[stage] ?? deal.probability
    const isClosed = stage === 'Closed Won' || stage === 'Closed Lost'
    // Auto-archive Closed Lost; auto-unarchive when moved back to an open stage.
    const isArchived = stage === 'Closed Lost' ? true : deal.isArchived ? false : deal.isArchived

    await query(
      `UPDATE crm_deals
       SET stage = $1,
           probability = $2,
           closed_at = CASE WHEN $3 THEN NOW() ELSE closed_at END,
           is_archived = $4,
           updated_at = NOW()
       WHERE id = $5`,
      [stage, probability, isClosed, isArchived, dealId]
    )

    // Keep the parent lead's status in sync with closed deals.
    if (stage === 'Closed Won') {
      await query(
        `UPDATE crm_leads SET status = 'Won', is_archived = FALSE, updated_at = NOW() WHERE id = $1`,
        [deal.leadId]
      )
    } else if (stage === 'Closed Lost') {
      await query(
        `UPDATE crm_leads SET status = 'Lost', is_archived = TRUE, updated_at = NOW() WHERE id = $1`,
        [deal.leadId]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('CRM deal change-stage error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ success: false, error: 'Failed to change stage' }, { status: 500 })
  }
}
