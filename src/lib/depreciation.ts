// Depreciation math per Bruno's 2026-05-20 spec.
//
// Rules:
//   - Purchased AFTER the 15th of month X -> depreciation starts month X+1.
//   - Sold BEFORE the 15th of month Y    -> depreciation ends at prior EOM (Y-1).
//   - Each month, the YTD annual total grows by perMonth.
//   - At year end, annual total folds into accumulated; annual total resets.
//
// All derived values (perYear, perMonth, monthsThisYear, annualTotalYTD,
// accumulated, bookValue) are computed on the fly. Inputs persisted:
// dateAcquired, cost, deprYears, priorYearEndAccumulated, soldDate (optional).

export interface DepreciationInputs {
  dateAcquired: string | Date
  cost: number
  deprYears: number
  priorYearEndAccumulated: number
  soldDate?: string | Date | null
  /** Date as-of which to compute (defaults to today). Used for period snapshots. */
  asOf?: string | Date
}

export interface DepreciationResult {
  perYear: number
  perMonth: number
  /** Number of months in the current year that have depreciated so far. */
  monthsThisYear: number
  /** YTD depreciation in the current calendar year. */
  annualTotalYTD: number
  /** All-time accumulated depreciation = prior + YTD. */
  accumulated: number
  /** Cost minus accumulated, floored at 0. */
  bookValue: number
  /** True if the asset is fully depreciated as of `asOf`. */
  fullyDepreciated: boolean
}

function toDate(v: string | Date): Date {
  if (v instanceof Date) return v
  // Avoid TZ shifting yyyy-mm-dd dates -- treat as UTC midnight
  return new Date(`${v.length === 10 ? v + 'T00:00:00Z' : v}`)
}

/** First month (1-12) of depreciation given the purchase date. */
function depreciationStartMonth(acquired: Date): { year: number; month: number } {
  const year = acquired.getUTCFullYear()
  const monthIndex = acquired.getUTCMonth() // 0-11
  const day = acquired.getUTCDate()
  if (day <= 15) {
    return { year, month: monthIndex + 1 } // same month
  }
  // After 15th -> start next month (rolls year if December)
  const next = monthIndex + 1 + 1 // +1 for next, but JS month is 0-indexed already
  if (next > 12) return { year: year + 1, month: 1 }
  return { year, month: next }
}

/** Last month (1-12) of depreciation given the sold date (inclusive of that month if sold after the 15th). */
function depreciationEndMonth(sold: Date): { year: number; month: number } {
  const year = sold.getUTCFullYear()
  const monthIndex = sold.getUTCMonth() // 0-11
  const day = sold.getUTCDate()
  if (day < 15) {
    // Sold before 15th -> stop at prior EOM
    const prevMonthIndex = monthIndex - 1
    if (prevMonthIndex < 0) return { year: year - 1, month: 12 }
    return { year, month: prevMonthIndex + 1 }
  }
  // 15th or later -> include current month
  return { year, month: monthIndex + 1 }
}

/** Count months from (startYear, startMonth) up to and including (endYear, endMonth) within the given calendar year. */
function monthsInYear(
  asOfYear: number,
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number
): number {
  const yearStart = asOfYear === startYear ? startMonth : asOfYear > startYear ? 1 : 13
  const yearEnd = asOfYear === endYear ? endMonth : asOfYear < endYear ? 12 : 0
  const months = yearEnd - yearStart + 1
  return Math.max(0, Math.min(12, months))
}

export function computeDepreciation(inputs: DepreciationInputs): DepreciationResult {
  const acquired = toDate(inputs.dateAcquired)
  const asOf = inputs.asOf ? toDate(inputs.asOf) : new Date()
  const sold = inputs.soldDate ? toDate(inputs.soldDate) : null

  const cost = Math.max(0, Number(inputs.cost) || 0)
  const yearsLife = Math.max(1, Number(inputs.deprYears) || 0)
  const priorAccum = Math.max(0, Number(inputs.priorYearEndAccumulated) || 0)

  const perYear = cost / yearsLife
  const perMonth = perYear / 12

  // Start month from acquisition rule
  const { year: startYear, month: startMonth } = depreciationStartMonth(acquired)

  // End month: min of (life expiry, sold date if sold)
  // Life expiry = start + (yearsLife * 12) - 1 months
  const totalMonths = yearsLife * 12
  const lifeEndIdx = startMonth - 1 + totalMonths - 1 // 0-indexed month count from start
  const lifeEndYear = startYear + Math.floor(lifeEndIdx / 12)
  const lifeEndMonth = (lifeEndIdx % 12) + 1

  let endYear = lifeEndYear
  let endMonth = lifeEndMonth
  if (sold) {
    const { year: sy, month: sm } = depreciationEndMonth(sold)
    if (sy < endYear || (sy === endYear && sm < endMonth)) {
      endYear = sy
      endMonth = sm
    }
  }

  const asOfYear = asOf.getUTCFullYear()
  const asOfMonth = asOf.getUTCMonth() + 1 // 1-12

  // Effective end up to "as of" date: cannot depreciate beyond asOf month
  let effEndYear = endYear
  let effEndMonth = endMonth
  if (asOfYear < endYear || (asOfYear === endYear && asOfMonth < endMonth)) {
    effEndYear = asOfYear
    effEndMonth = asOfMonth
  }

  // Months depreciated in current calendar year (asOfYear)
  let monthsThisYear = 0
  if (asOfYear >= startYear && asOfYear <= effEndYear) {
    monthsThisYear = monthsInYear(asOfYear, startYear, startMonth, effEndYear, effEndMonth)
  }

  const annualTotalYTD = Math.min(perMonth * monthsThisYear, perYear)
  // Accumulated = priorAccum from past years + this year YTD, capped at cost
  let accumulated = priorAccum + annualTotalYTD
  if (accumulated > cost) accumulated = cost

  const bookValue = Math.max(0, cost - accumulated)
  const fullyDepreciated = accumulated >= cost - 0.01

  return {
    perYear: round2(perYear),
    perMonth: round2(perMonth),
    monthsThisYear,
    annualTotalYTD: round2(annualTotalYTD),
    accumulated: round2(accumulated),
    bookValue: round2(bookValue),
    fullyDepreciated,
  }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export type DeprCategory =
  | 'chassis'
  | 'tankers'
  | 'belly_dumps'
  | 'sand_hoppers'
  | 'dry_vans'
  | 'flat_beds'
  | 'vehicles'
  | 'other'

export const CATEGORY_LABELS: Record<DeprCategory, string> = {
  chassis: 'Chassis',
  tankers: 'Tankers',
  belly_dumps: 'Belly Dumps',
  sand_hoppers: 'Sand Hoppers',
  dry_vans: 'Dry Vans',
  flat_beds: 'Flat Beds',
  vehicles: 'Vehicles',
  other: 'Other',
}

/** MANUS-aligned category order for grouped display. */
export const CATEGORY_ORDER: DeprCategory[] = [
  'chassis',
  'belly_dumps',
  'sand_hoppers',
  'dry_vans',
  'flat_beds',
  'tankers',
  'vehicles',
  'other',
]
