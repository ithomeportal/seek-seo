/**
 * GPS tracker health — pure classification of every fleet unit by the age of
 * its LAST DEVICE FIX.
 *
 * ⚠ Why this exists, and why it keys on `last_gps_time` and nothing else.
 *
 * `gps-sync.ts` already reports `silentDevices` — units SkyBitz did not return
 * at all. That check cannot see a DEAD TRACKER, because SkyBitz keeps serving
 * the last known position of a dead device forever. Such a unit is present in
 * every feed response, so `gps_synced_at` is refreshed every 30 minutes, the
 * "GPS data as of …" banner stays green, and the map pin sits exactly where a
 * healthy pin would. Two units were frozen for months before anyone noticed —
 * one of them (CH155) had not produced a fix since 2025-11-08 while being
 * actively rented, and it surfaced only when the equipment had to be
 * physically retrieved.
 *
 *   gps_synced_at  = when WE last talked to SkyBitz      → says nothing
 *   last_gps_time  = when the DEVICE last observed itself → the only truth
 *
 * Coverage is deliberately the WHOLE inventory, not just rented units: a
 * tracker that dies on an idle trailer in the yard is exactly the one you
 * discover at the worst moment, when that trailer goes back out.
 */

/** Ordered worst → best. The order drives report and email section order. */
export type GpsHealthTier =
  | 'never'
  | 'dead'
  | 'stale'
  | 'warn'
  | 'ok'
  | 'no_device'

export interface GpsHealthThresholds {
  /** A fix older than this is `warn`. */
  warnHours: number
  /** A fix older than this is `stale`. */
  staleHours: number
  /** A fix older than this is `dead`. */
  deadHours: number
}

export const DEFAULT_THRESHOLDS: GpsHealthThresholds = {
  warnHours: 24,
  staleHours: 72,
  deadHours: 168, // 7 days
}

/**
 * Statuses excluded from alerting. A sold unit is no longer our equipment, so
 * its tracker going quiet is not an incident — but the count is still reported
 * so the totals reconcile against the fleet table and nothing hides in a gap.
 */
export const NON_ALERTING_STATUSES: readonly string[] = ['sold']

/**
 * Fleet-status groupings used by the daily report's inventory sections.
 *
 * `available` is the only status that means "a customer could take this today";
 * `make_ready`, `return_inspection`, `damaged` and `maintenance` are all units
 * in the yard that are NOT rentable yet, and listing them as available is how a
 * report starts quoting equipment that cannot go out.
 *
 * `lease_to_own` sits with `rented` because the unit is out with a customer
 * earning money — the same thing Rodney is looking for when he asks where the
 * rented equipment is. Its own status is shown on every row, so nothing is
 * silently reclassified.
 *
 * ⚠ The third group — "in the yard, not rentable yet" — is deliberately NOT a
 * list. It is everything monitored that is in neither of the two lists above,
 * so the three sections plus the excluded (sold) units always account for the
 * WHOLE fleet. A hardcoded list would silently drop a status added later out of
 * all three tables, and a unit that appears in no section of a daily inventory
 * report is exactly the kind of quiet gap this feature exists to close.
 */
export const AVAILABLE_STATUSES: readonly string[] = ['available']
export const ON_RENT_STATUSES: readonly string[] = ['rented', 'lease_to_own']

/** Minimal row shape this module needs; a superset is fine. */
export interface GpsHealthUnitRow {
  unit_number: string
  trailer_type: string | null
  status: string
  rented_to: string | null
  skybitz_device_id: string | null
  last_gps_time: string | Date | null
  gps_synced_at: string | Date | null
  last_location: string | null
  last_latitude: string | number | null
  last_longitude: string | number | null
}

export interface GpsHealthUnit {
  unitNumber: string
  trailerType: string | null
  status: string
  rentedTo: string | null
  deviceId: string | null
  lastGpsTime: string | null
  gpsSyncedAt: string | null
  lastLocation: string | null
  /** Last known coordinates, so a report can link straight to the map. */
  latitude: number | null
  longitude: number | null
  /** Hours since the device's own last fix; null when it never reported. */
  ageHours: number | null
  tier: GpsHealthTier
  /** False for statuses we deliberately do not alert on (sold). */
  alerting: boolean
}

export interface GpsHealthReport {
  generatedAt: string
  thresholds: GpsHealthThresholds
  /** Every unit, classified. Sorted worst-first, then oldest-first. */
  units: GpsHealthUnit[]
  /** Units that need somebody to act — alerting units outside `ok`. */
  problems: GpsHealthUnit[]
  /**
   * Ready-to-rent inventory (`AVAILABLE_STATUSES`), unit order. Listed in full
   * every day — the daily report is also the answer to "what can I quote right
   * now, and is its tracker healthy".
   */
  available: GpsHealthUnit[]
  /** Units out with a customer (`ON_RENT_STATUSES`), unit order. */
  onRent: GpsHealthUnit[]
  /**
   * Monitored units in neither of the two groups above — make-ready, return
   * inspection, maintenance, damaged, and anything else added later. Derived by
   * exclusion so `available + onRent + inYard + totals.excluded === fleet`.
   */
  inYard: GpsHealthUnit[]
  /**
   * Tier counts over the MONITORED population only (sold excluded), so a
   * headline number always matches the rows listed underneath it. A pill
   * reading "Never 4" above an empty section is exactly the sort of quiet
   * mismatch that makes a report stop being believed.
   */
  counts: Record<GpsHealthTier, number>
  /** Tier counts over every unit, monitored or not. */
  countsAll: Record<GpsHealthTier, number>
  totals: {
    fleet: number
    alerting: number
    withDevice: number
    /** Excluded from alerting (sold), reported so the numbers reconcile. */
    excluded: number
  }
  /** Newest `gps_synced_at` across the whole fleet — the feed's own pulse. */
  lastSyncAt: string | null
  /** Hours since `lastSyncAt`; null when nothing ever synced. */
  syncAgeHours: number | null
  /** True when the sync pipeline itself looks dead (see `FEED_DOWN_HOURS`). */
  feedDown: boolean
  /** True when at least one alerting unit is outside `ok`. */
  hasProblems: boolean
}

/**
 * The sync runs every 30 minutes. Anything past this means the pipeline — not
 * an individual tracker — has stopped, which is a fleet-wide incident.
 */
export const FEED_DOWN_HOURS = 2

const TIER_ORDER: GpsHealthTier[] = [
  'never',
  'dead',
  'stale',
  'warn',
  'no_device',
  'ok',
]

export const TIER_LABEL: Record<GpsHealthTier, string> = {
  never: 'Never reported',
  dead: 'Dead',
  stale: 'Stale',
  warn: 'Warning',
  ok: 'Reporting normally',
  no_device: 'No tracker fitted',
}

/** Hex colours shared by the email, the admin panel and the map pins. */
export const TIER_COLOR: Record<GpsHealthTier, string> = {
  never: '#7f1d1d',
  dead: '#dc2626',
  stale: '#ea580c',
  warn: '#ca8a04',
  ok: '#16a34a',
  no_device: '#9ca3af',
}

/** Fleet status → human label, matching the admin Fleet Master badges. */
export const STATUS_LABEL: Record<string, string> = {
  available: 'Available',
  rented: 'Rented',
  lease_to_own: 'Lease to Own',
  damaged: 'Damaged',
  maintenance: 'Maintenance',
  make_ready: 'Make Ready',
  return_inspection: 'Return Inspection',
  for_sale: 'For Sale',
  sold: 'Sold',
}

/** Trailer type → human label, matching `TRAILER_TYPE_LABELS` in the dashboard. */
export const TRAILER_TYPE_LABEL: Record<string, string> = {
  sand_chassis: 'Sand Chassis',
  belly_dump: 'Belly Dump',
  sand_hopper: 'Sand Hopper',
  dry_van: 'Dry Van',
  flatbed: 'Flat Bed',
  tank: 'Tank',
}

/** Label a raw snake_case value, falling back to a readable form of itself. */
function labelled(map: Record<string, string>, value: string | null): string {
  if (!value) return '\u2014'
  return map[value] ?? value.replace(/_/g, ' ')
}

export const formatStatus = (status: string | null): string =>
  labelled(STATUS_LABEL, status)

export const formatTrailerType = (type: string | null): string =>
  labelled(TRAILER_TYPE_LABEL, type)

/**
 * pg returns `numeric` columns as strings. Coordinates are only ever used to
 * build a map link, so anything unparseable becomes null rather than `NaN`,
 * which would render a link pointing at nowhere.
 */
function toCoord(value: string | number | null): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

function toIso(value: string | Date | null): string | null {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function hoursSince(value: string | Date | null, now: number): number | null {
  const iso = toIso(value)
  if (!iso) return null
  return (now - new Date(iso).getTime()) / 3_600_000
}

/** Read thresholds from env, falling back to the defaults. */
export function thresholdsFromEnv(
  env: NodeJS.ProcessEnv = process.env
): GpsHealthThresholds {
  const num = (key: string, fallback: number): number => {
    const raw = (env[key] ?? '').trim()
    const parsed = Number(raw)
    return raw !== '' && Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
  }
  return {
    warnHours: num('GPS_WATCHDOG_WARN_HOURS', DEFAULT_THRESHOLDS.warnHours),
    staleHours: num('GPS_WATCHDOG_STALE_HOURS', DEFAULT_THRESHOLDS.staleHours),
    deadHours: num('GPS_WATCHDOG_DEAD_HOURS', DEFAULT_THRESHOLDS.deadHours),
  }
}

/**
 * The single classification rule, in one place.
 *
 * Exported in this raw form so the map can colour a pin from its own camelCase
 * unit shape without a second copy of the thresholds. Two implementations of
 * "is this tracker dead" would eventually disagree, and the map disagreeing
 * with the email is precisely the state this feature exists to end.
 */
export function tierForFix(
  lastGpsTime: string | Date | null,
  hasDevice: boolean,
  thresholds: GpsHealthThresholds = DEFAULT_THRESHOLDS,
  now: number = Date.now()
): GpsHealthTier {
  if (!hasDevice) return 'no_device'
  const ageHours = hoursSince(lastGpsTime, now)
  if (ageHours === null) return 'never'
  if (ageHours >= thresholds.deadHours) return 'dead'
  if (ageHours >= thresholds.staleHours) return 'stale'
  if (ageHours >= thresholds.warnHours) return 'warn'
  return 'ok'
}

/** Classify one unit. */
export function classifyUnit(
  row: GpsHealthUnitRow,
  thresholds: GpsHealthThresholds,
  now: number
): GpsHealthUnit {
  const ageHours = hoursSince(row.last_gps_time, now)
  const hasDevice = !!row.skybitz_device_id && row.skybitz_device_id.trim() !== ''
  const tier = tierForFix(row.last_gps_time, hasDevice, thresholds, now)

  return {
    unitNumber: row.unit_number,
    trailerType: row.trailer_type,
    status: row.status,
    rentedTo: row.rented_to,
    deviceId: row.skybitz_device_id,
    lastGpsTime: toIso(row.last_gps_time),
    gpsSyncedAt: toIso(row.gps_synced_at),
    lastLocation: row.last_location,
    latitude: toCoord(row.last_latitude),
    longitude: toCoord(row.last_longitude),
    ageHours: ageHours === null ? null : Math.round(ageHours),
    tier,
    alerting: !NON_ALERTING_STATUSES.includes(row.status),
  }
}

/**
 * Build the full health report from raw fleet rows.
 *
 * Pure: takes `now` so the classification is deterministic under test.
 */
export function buildHealthReport(
  rows: GpsHealthUnitRow[],
  options: { thresholds?: GpsHealthThresholds; now?: Date } = {}
): GpsHealthReport {
  const thresholds = options.thresholds ?? thresholdsFromEnv()
  const nowDate = options.now ?? new Date()
  const now = nowDate.getTime()

  const units = rows
    .map((row) => classifyUnit(row, thresholds, now))
    .sort((a, b) => {
      const byTier =
        TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier)
      if (byTier !== 0) return byTier
      // Oldest fix first inside a tier; "never" has no age and sorts by unit.
      if (a.ageHours !== null && b.ageHours !== null) {
        if (a.ageHours !== b.ageHours) return b.ageHours - a.ageHours
      }
      return a.unitNumber.localeCompare(b.unitNumber)
    })

  const emptyCounts = (): Record<GpsHealthTier, number> =>
    TIER_ORDER.reduce(
      (acc, tier) => ({ ...acc, [tier]: 0 }),
      {} as Record<GpsHealthTier, number>
    )
  const counts = emptyCounts()
  const countsAll = emptyCounts()
  for (const u of units) {
    countsAll[u.tier] += 1
    if (u.alerting) counts[u.tier] += 1
  }

  // A `no_device` unit is a coverage gap, not a malfunction, but it is still
  // something Rodney asked to see — "all of our inventory, even if not rented".
  const problems = units.filter((u) => u.alerting && u.tier !== 'ok')

  // These two are inventory listings, not incident lists, so they read in unit
  // order rather than the worst-first order `units` carries.
  const byUnit = (a: GpsHealthUnit, b: GpsHealthUnit) =>
    a.unitNumber.localeCompare(b.unitNumber, 'en', { numeric: true })
  const available = units
    .filter((u) => AVAILABLE_STATUSES.includes(u.status))
    .sort(byUnit)
  const onRent = units
    .filter((u) => ON_RENT_STATUSES.includes(u.status))
    .sort(byUnit)
  const inYard = units
    .filter(
      (u) =>
        u.alerting &&
        !AVAILABLE_STATUSES.includes(u.status) &&
        !ON_RENT_STATUSES.includes(u.status)
    )
    .sort(byUnit)

  const syncTimes = units
    .map((u) => u.gpsSyncedAt)
    .filter((v): v is string => v !== null)
    .sort()
  const lastSyncAt = syncTimes.length > 0 ? syncTimes[syncTimes.length - 1] : null
  const syncAgeRaw = hoursSince(lastSyncAt, now)

  return {
    generatedAt: nowDate.toISOString(),
    thresholds,
    units,
    problems,
    available,
    onRent,
    inYard,
    counts,
    countsAll,
    totals: {
      fleet: units.length,
      alerting: units.filter((u) => u.alerting).length,
      withDevice: units.filter((u) => u.deviceId).length,
      excluded: units.filter((u) => !u.alerting).length,
    },
    lastSyncAt,
    syncAgeHours: syncAgeRaw === null ? null : Math.round(syncAgeRaw * 10) / 10,
    feedDown: syncAgeRaw === null || syncAgeRaw >= FEED_DOWN_HOURS,
    hasProblems: problems.length > 0,
  }
}

/** "12 h" / "3 d" / "298 d" — compact age for tables and pin tooltips. */
export function formatAge(ageHours: number | null): string {
  if (ageHours === null) return 'never'
  if (ageHours < 48) return `${ageHours} h`
  return `${Math.round(ageHours / 24)} d`
}

/** The SQL every consumer uses, so the map and the email can never disagree. */
export const GPS_HEALTH_QUERY = `
  SELECT unit_number, trailer_type, status, rented_to,
         skybitz_device_id, last_gps_time, gps_synced_at, last_location,
         last_latitude, last_longitude
    FROM fleet_units
   ORDER BY unit_number
`
