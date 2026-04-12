import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query(
      `SELECT
        id, unit_number, trailer_type, status,
        skybitz_device_id, last_latitude, last_longitude,
        last_location, rented_to, updated_at, last_gps_time
      FROM fleet_units
      ORDER BY unit_number`
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
    }))

    return NextResponse.json({ success: true, data: units })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch GPS positions' },
      { status: 500 }
    )
  }
}
