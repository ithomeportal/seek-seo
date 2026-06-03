import { NextResponse } from 'next/server'
import { z } from 'zod'
import { CRM_TRAILER_TYPES, LEAD_STATUSES } from '@/lib/crm'
import { getLead, listActivities, listDeals, patchRow } from '@/lib/crm-db'

function parseId(id: string): number | null {
  const n = Number(id)
  return Number.isInteger(n) && n > 0 ? n : null
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const leadId = parseId(id)
  if (!leadId) {
    return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 })
  }
  try {
    const lead = await getLead(leadId)
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }
    const [deals, activities] = await Promise.all([
      listDeals({ leadId, includeArchived: true }),
      listActivities({ relatedToType: 'Lead', relatedToId: leadId }),
    ])
    return NextResponse.json({ success: true, data: { lead, deals, activities } })
  } catch (error) {
    console.error('CRM lead get error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ success: false, error: 'Failed to load lead' }, { status: 500 })
  }
}

const patchLeadSchema = z.object({
  companyName: z.string().min(1).optional(),
  contactName: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  state: z.string().max(2).nullable().optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  source: z.string().nullable().optional(),
  assignedTo: z.string().nullable().optional(),
  trailerInterest: z.array(z.enum(CRM_TRAILER_TYPES)).optional(),
  notes: z.string().nullable().optional(),
  estimatedMonthlyValue: z.number().min(0).optional(),
  isArchived: z.boolean().optional(),
})

const LEAD_FIELD_MAP: Record<string, string> = {
  companyName: 'company_name',
  contactName: 'contact_name',
  email: 'email',
  phone: 'phone',
  region: 'region',
  state: 'state',
  status: 'status',
  source: 'source',
  assignedTo: 'assigned_to',
  trailerInterest: 'trailer_interest',
  notes: 'notes',
  estimatedMonthlyValue: 'estimated_monthly_value',
  isArchived: 'is_archived',
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const leadId = parseId(id)
  if (!leadId) {
    return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = patchLeadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  // Auto-archive when status moves to Lost; auto-unarchive when it moves away.
  const patch: Record<string, unknown> = { ...parsed.data }
  if (patch.status !== undefined) {
    if (patch.status === 'Lost') patch.isArchived = true
    else if (patch.isArchived === undefined) patch.isArchived = false
  }
  if (patch.trailerInterest !== undefined) {
    patch.trailerInterest = JSON.stringify(patch.trailerInterest)
  }
  if (typeof patch.state === 'string') {
    patch.state = patch.state.toUpperCase()
  }

  try {
    const updated = await patchRow('crm_leads', leadId, patch, LEAD_FIELD_MAP)
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Nothing to update or not found' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('CRM lead update error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ success: false, error: 'Failed to update lead' }, { status: 500 })
  }
}
