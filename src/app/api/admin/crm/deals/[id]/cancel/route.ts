import { NextResponse } from 'next/server'
import { z } from 'zod'
import { query } from '@/lib/db'
import { getDeal } from '@/lib/crm-db'

const cancelSchema = z.object({ reason: z.string().max(255).optional() })

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
    // empty body is fine
  }

  const parsed = cancelSchema.safeParse(body ?? {})
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
  }

  try {
    const deal = await getDeal(dealId)
    if (!deal) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }
    await query(
      `UPDATE crm_deals
       SET stage = 'Closed Lost', probability = 0, closed_at = NOW(), cancelled_at = NOW(),
           cancellation_reason = $1, is_archived = TRUE, updated_at = NOW()
       WHERE id = $2`,
      [parsed.data.reason ?? null, dealId]
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('CRM deal cancel error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ success: false, error: 'Failed to cancel deal' }, { status: 500 })
  }
}
