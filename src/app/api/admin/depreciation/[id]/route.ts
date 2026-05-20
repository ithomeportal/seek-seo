import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { z } from 'zod'

const updateSchema = z.object({
  fleetUnitId: z.number().int().nullable().optional(),
  category: z.enum([
    'chassis',
    'tankers',
    'belly_dumps',
    'sand_hoppers',
    'dry_vans',
    'flat_beds',
    'vehicles',
    'other',
  ]).optional(),
  unitNumber: z.string().min(1).max(32).optional(),
  itemDescription: z.string().nullable().optional(),
  dateAcquired: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  cost: z.number().min(0).optional(),
  deprYears: z.number().int().min(1).max(50).optional(),
  priorYearEndAccumulated: z.number().min(0).optional(),
  soldDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  notes: z.string().nullable().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const recordId = parseInt(id, 10)
    if (isNaN(recordId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 })
    }
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      )
    }
    const d = parsed.data
    const fieldMap: Record<string, string> = {
      fleetUnitId: 'fleet_unit_id',
      category: 'category',
      unitNumber: 'unit_number',
      itemDescription: 'item_description',
      dateAcquired: 'date_acquired',
      cost: 'cost',
      deprYears: 'depr_years',
      priorYearEndAccumulated: 'prior_year_end_accumulated',
      soldDate: 'sold_date',
      notes: 'notes',
    }
    const setClauses: string[] = []
    const values: (string | number | null)[] = []
    let paramIndex = 1
    for (const [key, column] of Object.entries(fieldMap)) {
      if (key in d) {
        const val = d[key as keyof typeof d]
        setClauses.push(`${column} = $${paramIndex}`)
        values.push(val === '' ? null : (val as string | number | null))
        paramIndex++
      }
    }
    if (setClauses.length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 })
    }
    setClauses.push('updated_at = NOW()')
    values.push(recordId)
    const sql = `UPDATE depreciation_records SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING id`
    const result = await query(sql, values)
    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update depreciation record',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const recordId = parseInt(id, 10)
    if (isNaN(recordId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 })
    }
    const result = await query('DELETE FROM depreciation_records WHERE id = $1', [recordId])
    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete depreciation record',
      },
      { status: 500 }
    )
  }
}
