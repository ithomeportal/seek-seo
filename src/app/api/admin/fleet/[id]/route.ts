import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { z } from 'zod'

const updateUnitSchema = z.object({
  unitNumber: z.string().min(1).optional(),
  trailerType: z
    .enum([
      'sand_chassis',
      'belly_dump',
      'sand_hopper',
      'dry_van',
      'flatbed',
      'tank',
    ])
    .optional(),
  year: z.number().int().min(1900).max(2100).nullable().optional(),
  make: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  vin: z.string().nullable().optional(),
  purchasingCost: z.number().min(0).nullable().optional(),
  tireType: z.string().nullable().optional(),
  status: z
    .enum(['available', 'rented', 'damaged', 'for_sale', 'maintenance', 'sold'])
    .optional(),
  rentedTo: z.string().nullable().optional(),
  rentedToContact: z.string().nullable().optional(),
  rentalRate: z.number().min(0).nullable().optional(),
  depositTotal: z.number().min(0).nullable().optional(),
  pendingDeposit: z.number().min(0).nullable().optional(),
  rentStartDate: z.string().nullable().optional(),
  rentDueDay: z.string().nullable().optional(),
  skybitzDeviceId: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional().or(z.literal('')),
  notes: z.string().nullable().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const unitId = parseInt(id, 10)
    if (isNaN(unitId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid unit ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = updateUnitSchema.safeParse(body)

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

    // Build dynamic SET clause
    const setClauses: string[] = []
    const values: (string | number | boolean | null)[] = []
    let paramIndex = 1

    const fieldMap: Record<string, string> = {
      unitNumber: 'unit_number',
      trailerType: 'trailer_type',
      year: 'year',
      make: 'make',
      model: 'model',
      vin: 'vin',
      purchasingCost: 'purchasing_cost',
      tireType: 'tire_type',
      status: 'status',
      rentedTo: 'rented_to',
      rentedToContact: 'rented_to_contact',
      rentalRate: 'rental_rate',
      depositTotal: 'deposit_total',
      pendingDeposit: 'pending_deposit',
      rentStartDate: 'rent_start_date',
      rentDueDay: 'rent_due_day',
      skybitzDeviceId: 'skybitz_device_id',
      imageUrl: 'image_url',
      notes: 'notes',
    }

    for (const [key, column] of Object.entries(fieldMap)) {
      if (key in d) {
        const val = d[key as keyof typeof d]
        setClauses.push(`${column} = $${paramIndex}`)
        values.push(
          val === '' ? null : (val as string | number | boolean | null)
        )
        paramIndex++
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      )
    }

    setClauses.push(`updated_at = NOW()`)
    values.push(unitId)

    const sql = `UPDATE fleet_units SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING id`

    const result = await query(sql, values)

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Unit not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Unit updated successfully',
    })
  } catch (err) {
    const message =
      err instanceof Error && err.message.includes('duplicate')
        ? 'A unit with this number already exists'
        : 'Failed to update unit'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
