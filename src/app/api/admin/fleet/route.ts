import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query('SELECT * FROM fleet_units ORDER BY updated_at DESC')

    const units = result.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      unitNumber: row.unit_number,
      type: row.type,
      make: row.make,
      model: row.model,
      year: row.year,
      vin: row.vin,
      status: row.status,
      rentalRate: row.rental_rate,
      rentedTo: row.rented_to,
      location: row.location,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    return NextResponse.json({ success: true, data: units })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
