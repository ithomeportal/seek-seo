import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query('SELECT * FROM equipment_for_sale ORDER BY created_at DESC')

    const equipment = result.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      unitNumber: row.unit_number,
      type: row.type,
      make: row.make,
      model: row.model,
      year: row.year,
      vin: row.vin,
      askingPrice: row.asking_price,
      condition: row.condition,
      description: row.description,
      imageUrls: row.image_urls,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    return NextResponse.json({ success: true, data: equipment })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
