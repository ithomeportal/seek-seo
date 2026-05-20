import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { z } from 'zod'
import {
  CATEGORY_ORDER,
  computeDepreciation,
  type DeprCategory,
} from '@/lib/depreciation'

interface DeprRow {
  id: number
  fleet_unit_id: number | null
  category: DeprCategory
  unit_number: string
  item_description: string | null
  date_acquired: string
  cost: string
  depr_years: number
  prior_year_end_accumulated: string
  sold_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  fleet_sold_date: string | null
  fleet_sale_price: string | null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const asOfParam = searchParams.get('asOf')
    const asOf = asOfParam ? new Date(asOfParam) : new Date()

    const result = await query(
      `SELECT d.*,
              fu.sold_date AS fleet_sold_date,
              fu.sale_price AS fleet_sale_price
       FROM depreciation_records d
       LEFT JOIN fleet_units fu ON fu.id = d.fleet_unit_id
       ORDER BY
         CASE d.category
           WHEN 'chassis' THEN 1
           WHEN 'belly_dumps' THEN 2
           WHEN 'sand_hoppers' THEN 3
           WHEN 'dry_vans' THEN 4
           WHEN 'flat_beds' THEN 5
           WHEN 'tankers' THEN 6
           WHEN 'vehicles' THEN 7
           ELSE 99
         END,
         d.unit_number ASC`
    )

    const rows = (result.rows as DeprRow[]).map((r) => {
      const cost = parseFloat(r.cost)
      const priorAccum = parseFloat(r.prior_year_end_accumulated)
      // Sold date: prefer fleet_units.sold_date, fall back to depreciation_records.sold_date
      const soldDate = r.fleet_sold_date ?? r.sold_date ?? null
      const calc = computeDepreciation({
        dateAcquired: r.date_acquired,
        cost,
        deprYears: r.depr_years,
        priorYearEndAccumulated: priorAccum,
        soldDate,
        asOf,
      })
      return {
        id: r.id,
        fleetUnitId: r.fleet_unit_id,
        category: r.category,
        unitNumber: r.unit_number,
        itemDescription: r.item_description,
        dateAcquired: r.date_acquired,
        cost,
        deprYears: r.depr_years,
        priorYearEndAccumulated: priorAccum,
        soldDate,
        salePrice: r.fleet_sale_price ? parseFloat(r.fleet_sale_price) : null,
        notes: r.notes,
        ...calc,
      }
    })

    // Build per-category groups + grand totals (Beginning Balance style footer)
    const groups = CATEGORY_ORDER.map((cat) => {
      const items = rows.filter((r) => r.category === cat)
      const subtotal = items.reduce(
        (acc, it) => ({
          cost: acc.cost + it.cost,
          accumulated: acc.accumulated + it.accumulated,
          bookValue: acc.bookValue + it.bookValue,
          annualTotalYTD: acc.annualTotalYTD + it.annualTotalYTD,
          priorYearEndAccumulated: acc.priorYearEndAccumulated + it.priorYearEndAccumulated,
        }),
        { cost: 0, accumulated: 0, bookValue: 0, annualTotalYTD: 0, priorYearEndAccumulated: 0 }
      )
      return { category: cat, items, subtotal }
    }).filter((g) => g.items.length > 0)

    const asOfYear = asOf.getUTCFullYear()
    // Acquired YTD = items with date_acquired in current year
    const acquiredYTD = rows
      .filter((r) => new Date(r.dateAcquired).getUTCFullYear() === asOfYear)
      .reduce((s, r) => s + r.cost, 0)
    // Disposed YTD = items with sold_date in current year
    const disposedYTD = rows
      .filter((r) => r.soldDate && new Date(r.soldDate).getUTCFullYear() === asOfYear)
      .reduce((s, r) => s + r.cost, 0)

    const summary = {
      asOf: asOf.toISOString(),
      asOfYear,
      totalUnits: rows.length,
      beginningBalanceCost: rows.reduce((s, r) => s + r.cost, 0) - acquiredYTD + disposedYTD,
      acquiredYTD,
      disposedYTD,
      endBalanceCost: rows.filter((r) => !r.soldDate).reduce((s, r) => s + r.cost, 0),
      totalCost: rows.reduce((s, r) => s + r.cost, 0),
      totalPriorAccum: rows.reduce((s, r) => s + r.priorYearEndAccumulated, 0),
      totalAnnualYTD: rows.reduce((s, r) => s + r.annualTotalYTD, 0),
      totalAccumulated: rows.reduce((s, r) => s + r.accumulated, 0),
      totalBookValue: rows.reduce((s, r) => s + r.bookValue, 0),
    }

    return NextResponse.json({
      success: true,
      data: { rows, groups, summary },
    })
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to fetch depreciation records',
      },
      { status: 500 }
    )
  }
}

const createSchema = z.object({
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
  ]),
  unitNumber: z.string().min(1).max(32),
  itemDescription: z.string().nullable().optional(),
  dateAcquired: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cost: z.number().min(0),
  deprYears: z.number().int().min(1).max(50),
  priorYearEndAccumulated: z.number().min(0).default(0),
  soldDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  notes: z.string().nullable().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      )
    }
    const d = parsed.data
    const result = await query(
      `INSERT INTO depreciation_records (
        fleet_unit_id, category, unit_number, item_description, date_acquired,
        cost, depr_years, prior_year_end_accumulated, sold_date, notes,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING id`,
      [
        d.fleetUnitId ?? null,
        d.category,
        d.unitNumber.trim(),
        d.itemDescription || null,
        d.dateAcquired,
        d.cost,
        d.deprYears,
        d.priorYearEndAccumulated ?? 0,
        d.soldDate || null,
        d.notes || null,
      ]
    )
    return NextResponse.json({ success: true, data: { id: result.rows[0].id } })
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create depreciation record',
      },
      { status: 500 }
    )
  }
}
