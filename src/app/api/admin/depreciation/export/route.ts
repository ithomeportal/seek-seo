import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import * as XLSX from 'xlsx'
import {
  CATEGORY_LABELS,
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
  fleet_sold_date: string | null
  fleet_sale_price: string | null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const asOfParam = searchParams.get('asOf')
  const asOf = asOfParam ? new Date(asOfParam) : new Date()
  const asOfLabel = asOf.toISOString().split('T')[0]

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
  const rows = result.rows as DeprRow[]

  const sheetRows: (string | number)[][] = []
  sheetRows.push([
    `Seek Equipment Rentals LLC — Fixed Asset Depreciation (as of ${asOfLabel})`,
  ])
  sheetRows.push([])
  sheetRows.push([
    'Date Acquired',
    'Unit #',
    'Item/Description',
    'Cost',
    'Depr. # Years',
    'Per Year',
    'Per Month',
    '# Month',
    'Annual Total',
    `${asOf.getUTCFullYear() - 1} YR End`,
    'Accumulated',
    'Book-Val',
    'Sold/Removed',
    'Notes',
  ])

  let grandCost = 0
  let grandAccum = 0
  let grandBook = 0
  let grandYTD = 0

  for (const cat of CATEGORY_ORDER) {
    const inCat = rows.filter((r) => r.category === cat)
    if (inCat.length === 0) continue
    sheetRows.push([CATEGORY_LABELS[cat].toUpperCase()])
    for (const r of inCat) {
      const cost = parseFloat(r.cost)
      const priorAccum = parseFloat(r.prior_year_end_accumulated)
      const soldDate = r.fleet_sold_date ?? r.sold_date ?? null
      const calc = computeDepreciation({
        dateAcquired: r.date_acquired,
        cost,
        deprYears: r.depr_years,
        priorYearEndAccumulated: priorAccum,
        soldDate,
        asOf,
      })
      sheetRows.push([
        r.date_acquired,
        r.unit_number,
        r.item_description ?? '',
        cost,
        r.depr_years,
        calc.perYear,
        calc.perMonth,
        calc.monthsThisYear,
        calc.annualTotalYTD,
        priorAccum,
        calc.accumulated,
        calc.bookValue,
        soldDate ?? '',
        r.notes ?? '',
      ])
      grandCost += cost
      grandAccum += calc.accumulated
      grandBook += calc.bookValue
      grandYTD += calc.annualTotalYTD
    }
  }

  // Summary footer
  sheetRows.push([])
  sheetRows.push(['Beginning Balance', '', '', grandCost])
  sheetRows.push(['Total YTD Depreciation', '', '', '', '', '', '', '', grandYTD])
  sheetRows.push(['Total Accumulated', '', '', '', '', '', '', '', '', '', grandAccum])
  sheetRows.push(['Total Book Value', '', '', '', '', '', '', '', '', '', '', grandBook])

  const ws = XLSX.utils.aoa_to_sheet(sheetRows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `Depreciation ${asOfLabel}`)
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer

  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="seek-depreciation-${asOfLabel}.xlsx"`,
    },
  })
}
