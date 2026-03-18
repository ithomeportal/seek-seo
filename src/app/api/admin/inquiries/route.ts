import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query('SELECT * FROM contact_submissions ORDER BY created_at DESC')

    const submissions = result.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      company: row.company,
      message: row.message,
      type: row.type,
      trailerType: row.trailer_type,
      quantity: row.quantity,
      duration: row.duration,
      startDate: row.start_date,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    return NextResponse.json({ success: true, data: submissions })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
