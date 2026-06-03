import { NextResponse } from 'next/server'
import { z } from 'zod'
import { query } from '@/lib/db'
import { CRM_TRAILER_TYPES, DEAL_STAGES, STAGE_PROBABILITY } from '@/lib/crm'
import { activitySummariesFor, enrichmentFor, listDeals } from '@/lib/crm-db'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const leadIdParam = url.searchParams.get('leadId')
    const deals = await listDeals({
      stage: url.searchParams.get('stage') ?? undefined,
      owner: url.searchParams.get('owner') ?? undefined,
      trailerType: url.searchParams.get('trailerType') ?? undefined,
      region: url.searchParams.get('region') ?? undefined,
      leadId: leadIdParam ? Number(leadIdParam) : undefined,
      includeArchived: url.searchParams.get('includeArchived') === 'true',
      archivedOnly: url.searchParams.get('archivedOnly') === 'true',
    })
    const dealSums = await activitySummariesFor('Deal', deals.map((d) => d.id))
    // Fallback: deals with no deal-scoped activity use their parent lead's latest activity.
    const leadIds = Array.from(new Set(deals.map((d) => d.leadId)))
    const leadSums = await activitySummariesFor('Lead', leadIds)
    const data = deals.map((d) => ({
      ...d,
      ...enrichmentFor(dealSums.get(d.id) ?? leadSums.get(d.leadId)),
    }))
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('CRM deals list error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ success: false, error: 'Failed to load deals' }, { status: 500 })
  }
}

const createDealSchema = z.object({
  leadId: z.number().int().positive(),
  companyName: z.string().min(1),
  trailerType: z.enum(CRM_TRAILER_TYPES),
  quantity: z.number().int().min(1).default(1),
  monthlyRatePerUnit: z.number().min(0).default(0),
  rentalTermMonths: z.number().int().min(1).default(12),
  isMonthToMonth: z.boolean().default(false),
  region: z.string().optional(),
  stage: z.enum(DEAL_STAGES).default('Qualification'),
  assignedTo: z.string().optional(),
  expectedCloseDate: z.string().optional(),
  notes: z.string().optional(),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createDealSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const input = parsed.data
  try {
    const probability = STAGE_PROBABILITY[input.stage] ?? 25
    const isArchived = input.stage === 'Closed Lost'
    const result = await query(
      `INSERT INTO crm_deals
        (lead_id, company_name, trailer_type, quantity, monthly_rate_per_unit, rental_term_months,
         is_month_to_month, region, stage, probability, assigned_to, expected_close_date, notes, is_archived)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id`,
      [
        input.leadId,
        input.companyName,
        input.trailerType,
        input.quantity,
        input.monthlyRatePerUnit,
        input.rentalTermMonths,
        input.isMonthToMonth,
        input.region ?? null,
        input.stage,
        probability,
        input.assignedTo ?? null,
        input.expectedCloseDate ?? null,
        input.notes ?? null,
        isArchived,
      ]
    )
    return NextResponse.json({ success: true, data: { id: result.rows[0].id } })
  } catch (error) {
    console.error('CRM deal create error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ success: false, error: 'Failed to create deal' }, { status: 500 })
  }
}
