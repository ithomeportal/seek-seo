import { NextResponse } from 'next/server'
import { z } from 'zod'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query(
      `SELECT id, name, email, phone, active, created_at FROM crm_sales_reps WHERE active = TRUE ORDER BY name`
    )
    const data = result.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      active: row.active,
      createdAt: row.created_at,
    }))
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('CRM reps list error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ success: false, error: 'Failed to load sales reps' }, { status: 500 })
  }
}

const createRepSchema = z.object({
  name: z.string().min(1),
  email: z.string().optional(),
  phone: z.string().optional(),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createRepSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  try {
    const result = await query(
      `INSERT INTO crm_sales_reps (name, email, phone)
       VALUES ($1, $2, $3)
       ON CONFLICT (name) DO UPDATE SET active = TRUE
       RETURNING id`,
      [parsed.data.name, parsed.data.email ?? null, parsed.data.phone ?? null]
    )
    return NextResponse.json({ success: true, data: { id: result.rows[0].id } })
  } catch (error) {
    console.error('CRM rep create error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ success: false, error: 'Failed to create sales rep' }, { status: 500 })
  }
}
