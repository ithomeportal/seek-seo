import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { z } from 'zod'

export async function GET() {
  try {
    const result = await query(
      `SELECT * FROM fleet_units
       ORDER BY
         CASE trailer_type
           WHEN 'sand_chassis' THEN 1
           WHEN 'belly_dump' THEN 2
           WHEN 'sand_hopper' THEN 3
           WHEN 'dry_van' THEN 4
           WHEN 'flatbed' THEN 5
           WHEN 'tank' THEN 6
           ELSE 99
         END,
         unit_number ASC`
    )

    const units = result.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      unitNumber: row.unit_number,
      trailerType: row.trailer_type,
      year: row.year,
      make: row.make,
      model: row.model,
      vin: row.vin,
      purchasingCost: row.purchasing_cost,
      tireType: row.tire_type,
      status: row.status,
      rentedTo: row.rented_to,
      rentedToContact: row.rented_to_contact,
      rentalRate: row.rental_rate,
      depositTotal: row.deposit_total,
      pendingDeposit: row.pending_deposit,
      rentStartDate: row.rent_start_date,
      rentDueDay: row.rent_due_day,
      skybitzDeviceId: row.skybitz_device_id,
      lastLatitude: row.last_latitude,
      lastLongitude: row.last_longitude,
      notes: row.notes,
      imageUrl: row.image_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    return NextResponse.json({ success: true, data: units })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fleet units' },
      { status: 500 }
    )
  }
}

const createUnitSchema = z.object({
  unitNumber: z.string().min(1, 'Unit number is required'),
  trailerType: z.enum([
    'sand_chassis',
    'belly_dump',
    'sand_hopper',
    'dry_van',
    'flatbed',
    'tank',
  ]),
  year: z.number().int().min(1900).max(2100).nullable().optional(),
  make: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  vin: z.string().nullable().optional(),
  purchasingCost: z.number().min(0).nullable().optional(),
  tireType: z.string().nullable().optional(),
  status: z
    .enum(['available', 'rented', 'damaged', 'for_sale', 'maintenance', 'sold'])
    .default('available'),
  skybitzDeviceId: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional().or(z.literal('')),
  notes: z.string().nullable().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createUnitSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues.map((i) => i.message).join(', '),
        },
        { status: 400 }
      )
    }

    const d = parsed.data

    const result = await query(
      `INSERT INTO fleet_units (
        unit_number, trailer_type, year, make, model, vin,
        purchasing_cost, tire_type, status, skybitz_device_id,
        image_url, notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING id`,
      [
        d.unitNumber,
        d.trailerType,
        d.year ?? null,
        d.make || null,
        d.model || null,
        d.vin || null,
        d.purchasingCost ?? null,
        d.tireType || null,
        d.status,
        d.skybitzDeviceId || null,
        d.imageUrl || null,
        d.notes || null,
      ]
    )

    return NextResponse.json({
      success: true,
      data: { id: result.rows[0].id },
      message: 'Unit created successfully',
    })
  } catch (err) {
    const message =
      err instanceof Error && err.message.includes('duplicate')
        ? 'A unit with this number already exists'
        : 'Failed to create unit'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
