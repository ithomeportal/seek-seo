import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query(
      `SELECT
        id, unit_number, trailer_type, status,
        skybitz_device_id, last_latitude, last_longitude,
        last_location, rented_to, updated_at, last_gps_time, gps_synced_at
      FROM fleet_units
      ORDER BY unit_number`
    )

    // Unfiltered MAX() — the "GPS data as of" signal for the whole panel.
    // Without it the map renders identically whether the feed is live or has
    // been dead for four months.
    const sync = await query(
      `SELECT MAX(gps_synced_at) AS last_sync FROM fleet_units`
    )

    const units = result.rows.map((row) => ({
      id: row.id,
      unitNumber: row.unit_number,
      trailerType: row.trailer_type,
      status: row.status,
      skybitzDeviceId: row.skybitz_device_id,
      latitude: row.last_latitude ? parseFloat(row.last_latitude) : null,
      longitude: row.last_longitude ? parseFloat(row.last_longitude) : null,
      lastLocation: row.last_location,
      rentedTo: row.rented_to,
      updatedAt: row.updated_at,
      lastGpsTime: row.last_gps_time,
      gpsSyncedAt: row.gps_synced_at,
    }))

    return NextResponse.json({
      success: true,
      data: units,
      lastSyncAt: sync.rows[0]?.last_sync ?? null,
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch GPS positions' },
      { status: 500 }
    )
  }
}
