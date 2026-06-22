// Server-side data helpers for the CRM (ported from the MANUS trailer_crm server/db.ts).
// Row mapping (snake_case → camelCase), shared list queries, and activity summaries.
import { getPool } from './db'
import { classifyProgress, type ProgressState } from './crm'

// ===== API shapes =====
export interface CrmLead {
  id: number
  companyName: string
  contactName: string | null
  email: string | null
  phone: string | null
  region: string | null
  state: string | null
  status: string
  source: string | null
  assignedTo: string | null
  trailerInterest: string[]
  notes: string | null
  estimatedMonthlyValue: number
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

export interface CrmDeal {
  id: number
  leadId: number
  companyName: string
  trailerType: string
  quantity: number
  monthlyRatePerUnit: number
  rentalTermMonths: number
  isMonthToMonth: boolean
  region: string | null
  state: string | null
  stage: string
  probability: number
  assignedTo: string | null
  expectedCloseDate: string | null
  closedAt: string | null
  cancelledAt: string | null
  cancellationReason: string | null
  notes: string | null
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

export interface CrmActivity {
  id: number
  relatedToType: 'Lead' | 'Deal'
  relatedToId: number
  activityType: string
  notes: string | null
  assignedTo: string | null
  followUpAt: string | null
  status: string
  completedAt: string | null
  createdAt: string
}

export interface ActivitySummary {
  lastAt: Date | null
  lastType: string | null
  lastBy: string | null
  count30d: number
}

type Row = Record<string, unknown>

function iso(v: unknown): string | null {
  if (!v) return null
  return v instanceof Date ? v.toISOString() : String(v)
}

export function mapLead(row: Row): CrmLead {
  return {
    id: Number(row.id),
    companyName: String(row.company_name),
    contactName: (row.contact_name as string) ?? null,
    email: (row.email as string) ?? null,
    phone: (row.phone as string) ?? null,
    region: (row.region as string) ?? null,
    state: (row.state as string) ?? null,
    status: String(row.status),
    source: (row.source as string) ?? null,
    assignedTo: (row.assigned_to as string) ?? null,
    trailerInterest: Array.isArray(row.trailer_interest) ? (row.trailer_interest as string[]) : [],
    notes: (row.notes as string) ?? null,
    estimatedMonthlyValue: Number(row.estimated_monthly_value ?? 0),
    isArchived: Boolean(row.is_archived),
    createdAt: iso(row.created_at) ?? '',
    updatedAt: iso(row.updated_at) ?? '',
  }
}

export function mapDeal(row: Row): CrmDeal {
  return {
    id: Number(row.id),
    leadId: Number(row.lead_id),
    companyName: String(row.company_name),
    trailerType: String(row.trailer_type),
    quantity: Number(row.quantity ?? 1),
    monthlyRatePerUnit: Number(row.monthly_rate_per_unit ?? 0),
    rentalTermMonths: Number(row.rental_term_months ?? 12),
    isMonthToMonth: Boolean(row.is_month_to_month),
    region: (row.region as string) ?? null,
    state: (row.state as string) ?? null,
    stage: String(row.stage),
    probability: Number(row.probability ?? 0),
    assignedTo: (row.assigned_to as string) ?? null,
    expectedCloseDate: (row.expected_close_date as string) ?? null,
    closedAt: iso(row.closed_at),
    cancelledAt: iso(row.cancelled_at),
    cancellationReason: (row.cancellation_reason as string) ?? null,
    notes: (row.notes as string) ?? null,
    isArchived: Boolean(row.is_archived),
    createdAt: iso(row.created_at) ?? '',
    updatedAt: iso(row.updated_at) ?? '',
  }
}

export function mapActivity(row: Row): CrmActivity {
  return {
    id: Number(row.id),
    relatedToType: row.related_to_type as 'Lead' | 'Deal',
    relatedToId: Number(row.related_to_id),
    activityType: String(row.activity_type),
    notes: (row.notes as string) ?? null,
    assignedTo: (row.assigned_to as string) ?? null,
    followUpAt: iso(row.follow_up_at),
    status: String(row.status),
    completedAt: iso(row.completed_at),
    createdAt: iso(row.created_at) ?? '',
  }
}

// ===== List queries =====
export interface LeadFilters {
  status?: string
  owner?: string
  region?: string
  includeArchived?: boolean
  archivedOnly?: boolean
}

export async function listLeads(filters: LeadFilters = {}): Promise<CrmLead[]> {
  const conditions: string[] = []
  const params: (string | number | boolean)[] = []
  if (filters.archivedOnly) {
    conditions.push('is_archived = TRUE')
  } else if (!filters.includeArchived) {
    conditions.push('is_archived = FALSE')
  }
  if (filters.status) {
    params.push(filters.status)
    conditions.push(`status = $${params.length}`)
  }
  if (filters.owner) {
    params.push(filters.owner)
    conditions.push(`assigned_to = $${params.length}`)
  }
  if (filters.region) {
    params.push(filters.region)
    conditions.push(`region = $${params.length}`)
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const result = await getPool().query(
    `SELECT * FROM crm_leads ${where} ORDER BY created_at DESC`,
    params
  )
  return result.rows.map(mapLead)
}

export interface DealFilters {
  stage?: string
  owner?: string
  trailerType?: string
  region?: string
  leadId?: number
  includeArchived?: boolean
  archivedOnly?: boolean
}

export async function listDeals(filters: DealFilters = {}): Promise<CrmDeal[]> {
  const conditions: string[] = []
  const params: (string | number | boolean)[] = []
  if (filters.archivedOnly) {
    conditions.push('is_archived = TRUE')
  } else if (!filters.includeArchived) {
    conditions.push('is_archived = FALSE')
  }
  if (filters.stage) {
    params.push(filters.stage)
    conditions.push(`stage = $${params.length}`)
  }
  if (filters.owner) {
    params.push(filters.owner)
    conditions.push(`assigned_to = $${params.length}`)
  }
  if (filters.trailerType) {
    params.push(filters.trailerType)
    conditions.push(`trailer_type = $${params.length}`)
  }
  if (filters.region) {
    params.push(filters.region)
    conditions.push(`region = $${params.length}`)
  }
  if (filters.leadId !== undefined) {
    params.push(filters.leadId)
    conditions.push(`lead_id = $${params.length}`)
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const result = await getPool().query(
    `SELECT * FROM crm_deals ${where} ORDER BY created_at DESC`,
    params
  )
  return result.rows.map(mapDeal)
}

export interface ActivityFilters {
  relatedToType?: string
  relatedToId?: number
  owner?: string
  pendingOnly?: boolean
}

export async function listActivities(filters: ActivityFilters = {}): Promise<CrmActivity[]> {
  const conditions: string[] = []
  const params: (string | number)[] = []
  if (filters.relatedToType) {
    params.push(filters.relatedToType)
    conditions.push(`related_to_type = $${params.length}`)
  }
  if (filters.relatedToId !== undefined) {
    params.push(filters.relatedToId)
    conditions.push(`related_to_id = $${params.length}`)
  }
  if (filters.owner) {
    params.push(filters.owner)
    conditions.push(`assigned_to = $${params.length}`)
  }
  if (filters.pendingOnly) {
    conditions.push(`status = 'Pending'`)
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const result = await getPool().query(
    `SELECT * FROM crm_activities ${where} ORDER BY created_at DESC`,
    params
  )
  return result.rows.map(mapActivity)
}

// ===== Activity summaries (last activity + 30-day count per lead/deal) =====
export async function activitySummariesFor(
  relatedType: 'Lead' | 'Deal',
  ids: number[]
): Promise<Map<number, ActivitySummary>> {
  const out = new Map<number, ActivitySummary>()
  if (ids.length === 0) return out
  const result = await getPool().query(
    `SELECT related_to_id, activity_type, assigned_to, follow_up_at, completed_at, created_at
     FROM crm_activities
     WHERE related_to_type = $1 AND related_to_id = ANY($2::int[])
     ORDER BY created_at DESC`,
    [relatedType, ids]
  )
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
  for (const r of result.rows as Row[]) {
    const id = Number(r.related_to_id)
    const at = (r.completed_at ?? r.created_at) as Date | null
    if (!out.has(id)) {
      out.set(id, {
        lastAt: at ?? null,
        lastType: (r.activity_type as string) ?? null,
        lastBy: (r.assigned_to as string) ?? null,
        count30d: 0,
      })
    }
    const e = out.get(id)
    if (e && at && new Date(at).getTime() >= cutoff) e.count30d += 1
  }
  return out
}

export interface EnrichedActivityFields {
  lastActivityAt: string | null
  lastActivityType: string | null
  lastActivityBy: string | null
  activityCount30d: number
  progress: ProgressState
}

export function enrichmentFor(summary: ActivitySummary | undefined): EnrichedActivityFields {
  const lastActivityAt = summary?.lastAt ?? null
  return {
    lastActivityAt: lastActivityAt ? new Date(lastActivityAt).toISOString() : null,
    lastActivityType: summary?.lastType ?? null,
    lastActivityBy: summary?.lastBy ?? null,
    activityCount30d: summary?.count30d ?? 0,
    progress: classifyProgress({
      lastActivityAt,
      activityCount30d: summary?.count30d ?? 0,
    }),
  }
}

// ===== Single-row helpers =====
export async function getLead(id: number): Promise<CrmLead | null> {
  const result = await getPool().query('SELECT * FROM crm_leads WHERE id = $1 LIMIT 1', [id])
  return result.rows.length ? mapLead(result.rows[0]) : null
}

export async function getDeal(id: number): Promise<CrmDeal | null> {
  const result = await getPool().query('SELECT * FROM crm_deals WHERE id = $1 LIMIT 1', [id])
  return result.rows.length ? mapDeal(result.rows[0]) : null
}

// ===== Generic patch helper =====
// fieldMap: camelCase input key → snake_case column. Values are passed as-is.
export async function patchRow(
  table: 'crm_leads' | 'crm_deals' | 'crm_activities',
  id: number,
  patch: Record<string, unknown>,
  fieldMap: Record<string, string>
): Promise<boolean> {
  const sets: string[] = []
  const params: unknown[] = []
  for (const [key, column] of Object.entries(fieldMap)) {
    if (patch[key] !== undefined) {
      params.push(patch[key])
      sets.push(`${column} = $${params.length}`)
    }
  }
  if (sets.length === 0) return false
  if (table !== 'crm_activities') sets.push('updated_at = NOW()')
  params.push(id)
  const result = await getPool().query(
    `UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${params.length}`,
    params
  )
  return (result.rowCount ?? 0) > 0
}
