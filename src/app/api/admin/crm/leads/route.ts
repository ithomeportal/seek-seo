import { NextResponse } from 'next/server'
import { z } from 'zod'
import { query } from '@/lib/db'
import { CRM_TRAILER_TYPES, LEAD_STATUSES } from '@/lib/crm'
import { activitySummariesFor, enrichmentFor, listLeads } from '@/lib/crm-db'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const leads = await listLeads({
      status: url.searchParams.get('status') ?? undefined,
      owner: url.searchParams.get('owner') ?? undefined,
      region: url.searchParams.get('region') ?? undefined,
      includeArchived: url.searchParams.get('includeArchived') === 'true',
      archivedOnly: url.searchParams.get('archivedOnly') === 'true',
    })
    const summaries = await activitySummariesFor('Lead', leads.map((l) => l.id))
    const data = leads.map((l) => ({ ...l, ...enrichmentFor(summaries.get(l.id)) }))
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('CRM leads list error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ success: false, error: 'Failed to load leads' }, { status: 500 })
  }
}

const createLeadSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string().optional(),
  email: z.string().email('Email is required and must look like name@company.com'),
  phone: z.string().optional(),
  region: z.string().optional(),
  state: z.string().length(2).optional(),
  status: z.enum(LEAD_STATUSES).default('New'),
  source: z.string().optional(),
  assignedTo: z.string().optional(),
  trailerInterest: z.array(z.enum(CRM_TRAILER_TYPES)).default([]),
  notes: z.string().optional(),
  estimatedMonthlyValue: z.number().min(0).default(0),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createLeadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const input = parsed.data
  try {
    const isArchived = input.status === 'Lost'
    const result = await query(
      `INSERT INTO crm_leads
        (company_name, contact_name, email, phone, region, state, status, source,
         assigned_to, trailer_interest, notes, estimated_monthly_value, is_archived)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id`,
      [
        input.companyName,
        input.contactName ?? null,
        input.email,
        input.phone ?? null,
        input.region ?? null,
        input.state ? input.state.toUpperCase() : null,
        input.status,
        input.source ?? 'Manual',
        input.assignedTo ?? null,
        JSON.stringify(input.trailerInterest),
        input.notes ?? null,
        input.estimatedMonthlyValue,
        isArchived,
      ]
    )
    return NextResponse.json({ success: true, data: { id: result.rows[0].id } })
  } catch (error) {
    console.error('CRM lead create error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ success: false, error: 'Failed to create lead' }, { status: 500 })
  }
}
