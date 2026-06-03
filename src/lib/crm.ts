// CRM constants and pure helpers, ported from the sales team's MANUS trailer_crm
// (shared/crm.ts). Usable from server routes and client components.
// Trailer types use the site's canonical fleet_units keys, NOT the MANUS labels.

export const CRM_TRAILER_TYPES = [
  'sand_chassis',
  'sand_hopper',
  'belly_dump',
  'tank',
  'dry_van',
  'flatbed',
] as const
export type CrmTrailerType = (typeof CRM_TRAILER_TYPES)[number]

export const CRM_TRAILER_LABELS: Record<CrmTrailerType, string> = {
  sand_chassis: 'Sand Chassis',
  sand_hopper: 'Sand Hoppers',
  belly_dump: 'Belly Dumps',
  tank: 'Tanks',
  dry_van: 'Dry Vans',
  flatbed: 'Flat Beds',
}

export function crmTrailerLabel(type: string): string {
  return CRM_TRAILER_LABELS[type as CrmTrailerType] ?? type
}

// MANUS CRM label → site canonical key. Used by the import script / import API.
export const MANUS_TYPE_MAP: Record<string, CrmTrailerType> = {
  'Sand Chassis': 'sand_chassis',
  'Sand Hopper/BD': 'sand_hopper',
  'Belly Dump': 'belly_dump',
  Tanker: 'tank',
  'Dry Van': 'dry_van',
  'Flat Bed': 'flatbed',
}

// Default monthly rental rate per unit, used to pre-fill the Monthly Rate input
// on Add Deal forms. Sand Hopper/BD rents at the same baseline as Belly Dump.
export const DEFAULT_MONTHLY_RATE_BY_TYPE: Record<CrmTrailerType, number> = {
  sand_chassis: 1250,
  sand_hopper: 1600,
  belly_dump: 1600,
  tank: 1300,
  dry_van: 0,
  flatbed: 0,
}
export function defaultMonthlyRateFor(type: string): number {
  return DEFAULT_MONTHLY_RATE_BY_TYPE[type as CrmTrailerType] ?? 0
}

export const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'] as const
export type LeadStatus = (typeof LEAD_STATUSES)[number]

export const LEAD_SOURCES = [
  'Manual',
  'Facebook',
  'Cold Call',
  'Customer Referral',
  'Seek Website',
  'Google',
  'Instagram',
  'Truck Paper',
  'FMCSA',
] as const
export type LeadSource = (typeof LEAD_SOURCES)[number]

export const DEAL_STAGES = ['Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'] as const
export type DealStage = (typeof DEAL_STAGES)[number]

export const ACTIVITY_TYPES = ['Call', 'Email', 'Meeting', 'Note', 'Follow-up'] as const
export type ActivityType = (typeof ACTIVITY_TYPES)[number]

export const REGIONS = [
  'Permian',
  'Bakken',
  'Eagle Ford',
  'Marcellus',
  'Haynesville',
  'Anadarko',
  'Powder River',
  'Niobrara',
  'DJ Basin',
  'Appalachian',
] as const

export const STAGE_PROBABILITY: Record<string, number> = {
  Qualification: 25,
  Proposal: 50,
  Negotiation: 75,
  'Closed Won': 100,
  'Closed Lost': 0,
}

export const DEFAULT_ACTIVITY_OWNER = 'E. Mendoza'

// Default follow-up time: 07:00 AM US Central Time.
// Approximate Central as UTC-6 (CST) or UTC-5 (CDT) based on the period of the year.
export function defaultFollowUpAtCentral(dateOnlyIso: string): Date {
  const [y, m, d] = dateOnlyIso.split('-').map((n) => parseInt(n, 10))
  const mar = nthSunday(y, 2, 2)
  const nov = nthSunday(y, 10, 1)
  const candidate = Date.UTC(y, m - 1, d, 12, 0, 0)
  const isDst = candidate >= mar && candidate < nov
  const offsetHours = isDst ? 5 : 6 // CDT=UTC-5, CST=UTC-6 → 07:00 local = 12:00/13:00 UTC
  return new Date(Date.UTC(y, m - 1, d, 7 + offsetHours, 0, 0))
}
function nthSunday(year: number, monthIdx: number, n: number): number {
  const first = new Date(Date.UTC(year, monthIdx, 1))
  const dow = first.getUTCDay()
  const day = 1 + ((7 - dow) % 7) + (n - 1) * 7
  return Date.UTC(year, monthIdx, day, 12, 0, 0)
}

// Total contract value = qty * monthlyRate * termMonths.
// Month-to-month deals commit to exactly one month of rent.
export function totalContractValue(
  qty: number,
  monthlyRatePerUnit: number,
  termMonths: number,
  isMonthToMonth = false
): number {
  if (isMonthToMonth) return Math.max(0, qty) * Math.max(0, monthlyRatePerUnit)
  return Math.max(0, qty) * Math.max(0, monthlyRatePerUnit) * Math.max(0, termMonths)
}
export function formatTermLabel(termMonths: number, isMonthToMonth = false): string {
  if (isMonthToMonth) return 'MTM'
  return `${Math.max(0, termMonths)} mo`
}
export function monthlyDealRevenue(qty: number, monthlyRatePerUnit: number): number {
  return Math.max(0, qty) * Math.max(0, monthlyRatePerUnit)
}

// Follow-up classification
export type FollowupBucket = 'overdue' | 'due-soon' | 'scheduled'
export function classifyFollowUp(
  followUpAt: Date | null | undefined,
  now: Date = new Date()
): FollowupBucket | null {
  if (!followUpAt) return null
  const diffMs = followUpAt.getTime() - now.getTime()
  if (diffMs < 0) return 'overdue'
  if (diffMs <= 24 * 60 * 60 * 1000) return 'due-soon'
  return 'scheduled'
}
export function humanCountdown(target: Date, now: Date = new Date()): string {
  let s = Math.round((target.getTime() - now.getTime()) / 1000)
  const overdue = s < 0
  s = Math.abs(s)
  const d = Math.floor(s / 86400)
  s -= d * 86400
  const h = Math.floor(s / 3600)
  s -= h * 3600
  const m = Math.floor(s / 60)
  let out = ''
  if (d > 0) out = `${d}d ${h}h`
  else if (h > 0) out = `${h}h ${m}m`
  else out = `${m}m`
  return overdue ? `OVERDUE by ${out}` : `in ${out}`
}

// Follow-up alert center grouping
export type FollowupSection = 'overdue' | 'today' | 'thisWeek' | 'upcoming'
export function followupSection(followUpAt: Date, now: Date = new Date()): FollowupSection {
  const target = followUpAt.getTime()
  const nowMs = now.getTime()
  if (target < nowMs) return 'overdue'
  const sameDay =
    followUpAt.getFullYear() === now.getFullYear() &&
    followUpAt.getMonth() === now.getMonth() &&
    followUpAt.getDate() === now.getDate()
  if (sameDay) return 'today'
  const diffMs = target - nowMs
  if (diffMs <= 7 * 24 * 60 * 60 * 1000) return 'thisWeek'
  return 'upcoming'
}

// Last-activity + progress classifier
export type ProgressState = 'Advancing' | 'Steady' | 'Stalling' | 'Cold' | 'No Activity'
export interface ProgressInputs {
  lastActivityAt: Date | null | undefined
  activityCount30d?: number
  stageAdvancedRecently?: boolean
  now?: Date
}
export function classifyProgress(input: ProgressInputs): ProgressState {
  const now = input.now ?? new Date()
  if (!input.lastActivityAt) return 'No Activity'
  const days = Math.floor((now.getTime() - input.lastActivityAt.getTime()) / (24 * 60 * 60 * 1000))
  if (input.stageAdvancedRecently) return 'Advancing'
  if ((input.activityCount30d ?? 0) >= 2 && days <= 14) return 'Advancing'
  if (days <= 14) return 'Steady'
  if (days <= 30) return 'Stalling'
  return 'Cold'
}
export function progressToneClass(state: ProgressState): string {
  switch (state) {
    case 'Advancing':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'Steady':
      return 'bg-sky-100 text-sky-800 border-sky-200'
    case 'Stalling':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'Cold':
      return 'bg-rose-100 text-rose-800 border-rose-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}
export function daysSince(d: Date | null | undefined, now: Date = new Date()): number | null {
  if (!d) return null
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000)))
}

// Lead status / deal stage badge tones (mirrors the MANUS CRM palette)
export function leadStatusToneClass(status: string): string {
  switch (status) {
    case 'New':
      return 'bg-slate-100 text-slate-700 border-slate-200'
    case 'Contacted':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'Qualified':
      return 'bg-violet-100 text-violet-800 border-violet-200'
    case 'Proposal Sent':
      return 'bg-amber-100 text-amber-900 border-amber-200'
    case 'Won':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'Lost':
      return 'bg-rose-100 text-rose-800 border-rose-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}
export function dealStageToneClass(stage: string): string {
  switch (stage) {
    case 'Qualification':
      return 'bg-slate-100 text-slate-700 border-slate-200'
    case 'Proposal':
      return 'bg-amber-100 text-amber-900 border-amber-200'
    case 'Negotiation':
      return 'bg-violet-100 text-violet-800 border-violet-200'
    case 'Closed Won':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'Closed Lost':
      return 'bg-rose-100 text-rose-800 border-rose-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

// Email validation (pragmatic, same rule on client + server)
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
export function isValidEmail(value: string | null | undefined): boolean {
  if (!value) return false
  return EMAIL_RE.test(value.trim())
}

// US states
export const US_STATES: ReadonlyArray<{ code: string; name: string }> = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
]
export const US_STATE_CODES: ReadonlyArray<string> = US_STATES.map((s) => s.code)
export function isValidStateCode(code: string | null | undefined): boolean {
  if (!code) return false
  return US_STATE_CODES.includes(code.toUpperCase())
}

// ===== Archive policy =====
// Lost leads / Closed Lost deals are auto-archived; moving back clears the flag.
export function deriveArchiveFromStage(stage: string, currentlyArchived = false): boolean {
  if (stage === 'Closed Lost') return true
  if (currentlyArchived) return false
  return currentlyArchived
}
export function deriveArchiveFromLeadStatus(status: string, currentlyArchived = false): boolean {
  if (status === 'Lost') return true
  if (currentlyArchived) return false
  return currentlyArchived
}
export const REOPEN_DEFAULT_LEAD_STATUS = 'New' as const
export const REOPEN_DEFAULT_DEAL_STAGE = 'Qualification' as const
