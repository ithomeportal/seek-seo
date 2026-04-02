import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { fetchPositions } from '@/lib/skybitz'

/** POST /api/admin/gps/skybitz — Refresh GPS positions from SkyBitz */
export async function POST() {
  try {
    const positions = await fetchPositions()

    if (positions === null) {
      return NextResponse.json({
        success: false,
        error:
          'SkyBitz API not configured. Set SKYBITZ_API_URL, SKYBITZ_XML_USERNAME, and SKYBITZ_XML_PASSWORD.',
        configured: false,
      })
    }

    let updated = 0
    for (const pos of positions) {
      const result = await query(
        `UPDATE fleet_units
         SET last_latitude = $1,
             last_longitude = $2,
             updated_at = NOW()
         WHERE skybitz_device_id = $3`,
        [pos.latitude, pos.longitude, pos.assetId]
      )
      if (result.rowCount && result.rowCount > 0) updated++
    }

    return NextResponse.json({
      success: true,
      configured: true,
      totalPositions: positions.length,
      updatedUnits: updated,
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to refresh SkyBitz positions' },
      { status: 500 }
    )
  }
}

/** GET /api/admin/gps/skybitz — Check SkyBitz connection status */
export async function GET() {
  const apiUrl = process.env.SKYBITZ_API_URL ?? ''
  const username = process.env.SKYBITZ_XML_USERNAME ?? ''

  return NextResponse.json({
    success: true,
    configured: apiUrl !== '' && username !== '',
    provider: 'SkyBitz (AMETEK)',
    authMode: 'XML Legacy',
  })
}
