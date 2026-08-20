/**
 * Shared SkyBitz → fleet_units sync.
 *
 * Used by both the admin "Refresh GPS" button and the half-hourly cron, so
 * the two can never drift apart.
 */

import { query } from '@/lib/db'
import { fetchPositions, normalizeAssetId } from '@/lib/skybitz'

export interface GpsSyncResult {
  success: boolean
  /** Machine-readable failure reason; absent on success. */
  reason?: string
  error?: string
  /** Positions returned by SkyBitz. */
  totalPositions: number
  /** Rows actually written. */
  updatedUnits: number
  /** SkyBitz asset ids with no matching fleet unit. */
  unmatchedAssets: string[]
  /** Fleet units holding a device id SkyBitz no longer reports. */
  silentDevices: string[]
  /** Units whose UPDATE threw; each is isolated, one cannot kill the batch. */
  failedUnits: { unitNumber: string; error: string }[]
  syncedAt: string | null
}

interface FleetDeviceRow {
  id: number
  unit_number: string
  skybitz_device_id: string
}

/**
 * Pull every position from SkyBitz and write it onto the matching fleet unit.
 *
 * Each UPDATE runs in its own try/catch. A previous version put all ~48
 * sequential awaits inside one try, so a single bad row would abort the whole
 * batch and leave the rest of the fleet frozen with no indication why.
 */
export async function syncGpsPositions(): Promise<GpsSyncResult> {
  const empty = {
    totalPositions: 0,
    updatedUnits: 0,
    unmatchedAssets: [],
    silentDevices: [],
    failedUnits: [],
    syncedAt: null,
  }

  const result = await fetchPositions()

  if (!result.ok) {
    console.error(
      `[gps-sync] SkyBitz fetch failed (${result.reason}): ${result.detail}`
    )
    return {
      success: false,
      reason: result.reason,
      error: result.detail,
      ...empty,
    }
  }

  const { positions } = result

  const fleet = await query<FleetDeviceRow>(
    `SELECT id, unit_number, skybitz_device_id
       FROM fleet_units
      WHERE skybitz_device_id IS NOT NULL`
  )

  // Exact id wins; the normalized key is the fallback that reconciles the
  // feed's zero-padded tank ids (TC015) with the fleet table's (TC15).
  const byExact = new Map<string, FleetDeviceRow>()
  const byNormalized = new Map<string, FleetDeviceRow>()
  for (const row of fleet.rows) {
    byExact.set(row.skybitz_device_id, row)
    byNormalized.set(normalizeAssetId(row.skybitz_device_id), row)
  }

  const syncedAt = new Date().toISOString()
  const unmatchedAssets: string[] = []
  const failedUnits: { unitNumber: string; error: string }[] = []
  const seen = new Set<number>()
  let updatedUnits = 0

  for (const pos of positions) {
    const unit =
      byExact.get(pos.assetId) ?? byNormalized.get(normalizeAssetId(pos.assetId))

    if (!unit) {
      unmatchedAssets.push(pos.assetId)
      continue
    }

    try {
      await query(
        `UPDATE fleet_units
            SET last_latitude  = $1,
                last_longitude = $2,
                last_location  = $3,
                last_gps_time  = $4,
                gps_synced_at  = $5
          WHERE id = $6`,
        [
          pos.latitude,
          pos.longitude,
          pos.location,
          pos.observedAt || null,
          syncedAt,
          unit.id,
        ]
      )
      seen.add(unit.id)
      updatedUnits++
    } catch (err) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code: unknown }).code)
          : 'unknown'
      const message = err instanceof Error ? err.message : String(err)
      console.error(
        `[gps-sync] UPDATE failed for ${unit.unit_number} ` +
          `(asset ${pos.assetId}, SQLSTATE ${code}): ${message}`
      )
      failedUnits.push({ unitNumber: unit.unit_number, error: `${code}: ${message}` })
    }
  }

  // Units carrying a device id that SkyBitz did not report at all. Their
  // coordinates are frozen; without this list they look identical to a
  // healthy unit on the map.
  const silentDevices = fleet.rows
    .filter((r) => !seen.has(r.id))
    .map((r) => r.unit_number)
    .sort()

  if (unmatchedAssets.length > 0) {
    console.warn(
      `[gps-sync] ${unmatchedAssets.length} SkyBitz asset(s) matched no fleet unit: ${unmatchedAssets.join(', ')}`
    )
  }
  if (silentDevices.length > 0) {
    console.warn(
      `[gps-sync] ${silentDevices.length} unit(s) not reported by SkyBitz: ${silentDevices.join(', ')}`
    )
  }

  return {
    success: failedUnits.length === 0,
    error:
      failedUnits.length > 0
        ? `${failedUnits.length} unit(s) failed to update`
        : undefined,
    totalPositions: positions.length,
    updatedUnits,
    unmatchedAssets,
    silentDevices,
    failedUnits,
    syncedAt,
  }
}
