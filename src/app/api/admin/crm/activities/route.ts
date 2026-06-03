import { NextResponse } from 'next/server'
import { z } from 'zod'
import { query } from '@/lib/db'
import { ACTIVITY_TYPES, DEFAULT_ACTIVITY_OWNER, defaultFollowUpAtCentral } from '@/lib/crm'
import { listActivities } from '@/lib/crm-db'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const relatedToIdParam = url.searchParams.get('relatedToId')
    const data = await listActivities({
      relatedToType: url.searchParams.get('relatedToType') ?? undefined,
      relatedToId: relatedToIdParam ? Number(relatedToIdParam) : undefined,
      owner: url.searchParams.get('owner') ?? undefined,
      pendingOnly: url.searchParams.get('pendingOnly') === 'true',
    })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('CRM activities list error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ success: false, error: 'Failed to load activities' }, { status: 500 })
  }
}

const createActivitySchema = z.object({
  relatedToType: z.enum(['Lead', 'Deal']),
  relatedToId: z.number().int().positive(),
  activityType: z.enum(ACTIVITY_TYPES),
  notes: z.string().optional(),
  assignedTo: z.string().optional(),
  followUpDate: z.string().optional(), // "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM"
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createActivitySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const input = parsed.data
  try {
    let followUpAt: Date | null = null
    if (input.followUpDate) {
      followUpAt = input.followUpDate.includes('T')
        ? new Date(input.followUpDate)
        : defaultFollowUpAtCentral(input.followUpDate)
      if (Number.isNaN(followUpAt.getTime())) {
        return NextResponse.json({ success: false, error: 'Invalid follow-up date' }, { status: 400 })
      }
    }
    const status = followUpAt ? 'Pending' : 'Completed'
    const result = await query(
      `INSERT INTO crm_activities
        (related_to_type, related_to_id, activity_type, notes, assigned_to, follow_up_at, status, completed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7, CASE WHEN $7 = 'Completed' THEN NOW() ELSE NULL END)
       RETURNING id`,
      [
        input.relatedToType,
        input.relatedToId,
        input.activityType,
        input.notes ?? '',
        input.assignedTo ?? DEFAULT_ACTIVITY_OWNER,
        followUpAt ? followUpAt.toISOString() : null,
        status,
      ]
    )
    return NextResponse.json({ success: true, data: { id: result.rows[0].id } })
  } catch (error) {
    console.error('CRM activity create error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ success: false, error: 'Failed to create activity' }, { status: 500 })
  }
}
