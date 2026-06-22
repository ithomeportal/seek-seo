import { NextResponse } from 'next/server'
import { z } from 'zod'
import { CRM_TRAILER_TYPES, DEAL_STAGES, STAGE_PROBABILITY } from '@/lib/crm'
import { getDeal, patchRow } from '@/lib/crm-db'

const patchDealSchema = z.object({
  quantity: z.number().int().min(1).optional(),
  monthlyRatePerUnit: z.number().min(0).optional(),
  rentalTermMonths: z.number().int().min(1).optional(),
  isMonthToMonth: z.boolean().optional(),
  region: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  trailerType: z.enum(CRM_TRAILER_TYPES).optional(),
  assignedTo: z.string().nullable().optional(),
  expectedCloseDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  stage: z.enum(DEAL_STAGES).optional(),
  isArchived: z.boolean().optional(),
})

const DEAL_FIELD_MAP: Record<string, string> = {
  quantity: 'quantity',
  monthlyRatePerUnit: 'monthly_rate_per_unit',
  rentalTermMonths: 'rental_term_months',
  isMonthToMonth: 'is_month_to_month',
  region: 'region',
  state: 'state',
  trailerType: 'trailer_type',
  assignedTo: 'assigned_to',
  expectedCloseDate: 'expected_close_date',
  notes: 'notes',
  stage: 'stage',
  probability: 'probability',
  isArchived: 'is_archived',
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dealId = Number(id)
  if (!Number.isInteger(dealId) || dealId <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 })
  }
  try {
    const deal = await getDeal(dealId)
    if (!deal) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: deal })
  } catch (error) {
    console.error('CRM deal get error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ success: false, error: 'Failed to load deal' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const parsed = patchDealSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  // Stage → archive coupling stays consistent with change-stage.
  const patch: Record<string, unknown> = { ...parsed.data }
  if (patch.stage !== undefined) {
    patch.probability = STAGE_PROBABILITY[patch.stage as string] ?? 25
    if (patch.stage === 'Closed Lost') patch.isArchived = true
    else if (patch.isArchived === undefined) patch.isArchived = false
  }

  try {
    const updated = await patchRow('crm_deals', dealId, patch, DEAL_FIELD_MAP)
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Nothing to update or not found' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('CRM deal update error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ success: false, error: 'Failed to update deal' }, { status: 500 })
  }
}
