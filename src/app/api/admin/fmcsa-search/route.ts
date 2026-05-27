import { NextRequest, NextResponse } from 'next/server'
import { getFmcsaPool, getGeoZipPool } from '@/lib/fmcsa-db'
import { fmcsaSearchSchema, type FmcsaSearchFilters } from '@/lib/validators'

export const dynamic = 'force-dynamic'

/**
 * FMCSA carrier search — read-only port of AP_module's
 * lib/actions/fmcsa-search.ts server action, exposed as a seek-seo admin API.
 *
 * Reads unilink_portal_ap.fmcsa_census_carriers + geo_zip_usa_can_mex.postal_codes
 * (same Aiven host, see src/lib/fmcsa-db.ts). No writes, no "add to carriers" /
 * census-resync actions — seek-seo is a pure consumer of AP_module's synced data.
 */

export interface FmcsaSearchResultRow {
  id: string
  dotNumber: string
  mcNumber: string | null
  legalName: string | null
  dbaName: string | null
  phyStreet: string | null
  phyCity: string | null
  phyState: string | null
  phyZip: string | null
  phone: string | null
  email: string | null
  powerUnits: number | null
  drivers: number | null
  operatingStatus: string | null
  cargoCarried: string[]
  hmFlag: boolean
  distanceMiles: number | null
  latitude: number | null
  longitude: number | null
}

interface ZipCentre {
  zip: string
  lat: number
  lon: number
  city: string | null
  state: string | null
}

async function lookupZipCenter(zip: string): Promise<ZipCentre | null> {
  const res = await getGeoZipPool().query<{
    postal_code: string
    latitude: string
    longitude: string
    city: string | null
    state_province: string | null
  }>(
    `SELECT postal_code, latitude::text, longitude::text, city, state_province
       FROM postal_codes
      WHERE postal_code = $1 AND country = 'USA'
      LIMIT 1`,
    [zip.padStart(5, '0')]
  )
  if (res.rows.length === 0) return null
  const r = res.rows[0]
  return {
    zip: r.postal_code,
    lat: parseFloat(r.latitude),
    lon: parseFloat(r.longitude),
    city: r.city,
    state: r.state_province,
  }
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = fmcsaSearchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid filters', details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const filters: FmcsaSearchFilters = parsed.data

  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(500, Math.max(1, filters.pageSize ?? 100))
  const offset = (page - 1) * pageSize

  const minPU = filters.minPowerUnits ?? 20
  const maxPU = filters.maxPowerUnits
  const radiusMiles = filters.radiusMiles ?? 50
  const onlyActive = filters.onlyActive ?? true

  try {
    // Resolve centre for radius search.
    let centre: ZipCentre | null = null
    if (filters.zip && filters.zip.length >= 5) {
      centre = await lookupZipCenter(filters.zip.slice(0, 5))
    }

    const conditions: string[] = []
    const params: unknown[] = []
    const pushParam = (v: unknown) => {
      params.push(v)
      return `$${params.length}`
    }

    if (onlyActive) conditions.push(`operating_status = 'ACTIVE'`)
    if (filters.hmOnly) conditions.push(`hm_flag = TRUE`)
    if (filters.hasContactOnly) {
      conditions.push(`(
        (email IS NOT NULL AND btrim(email) <> '') OR
        (phone IS NOT NULL AND btrim(phone) <> '')
      )`)
    }
    if (filters.recentMcs150Only) {
      conditions.push(`mcs150_date IS NOT NULL AND mcs150_date >= (now() - INTERVAL '24 months')`)
    }

    conditions.push(`power_units >= ${pushParam(minPU)}`)
    if (typeof maxPU === 'number') conditions.push(`power_units <= ${pushParam(maxPU)}`)

    if (filters.state && filters.state.length === 2) {
      conditions.push(`phy_state = ${pushParam(filters.state.toUpperCase())}`)
    }

    if (filters.cargo && filters.cargo.length > 0) {
      conditions.push(`cargo_carried && ${pushParam(filters.cargo)}`) // array overlap
    }

    if (filters.nameTokens && filters.nameTokens.length > 0) {
      const tokens = filters.nameTokens.map((t) => t.trim()).filter((t) => t.length > 0)
      if (tokens.length > 0) {
        const clauses = tokens.map((t) => {
          const p = pushParam(`%${t.toLowerCase()}%`)
          return `(lower(legal_name) LIKE ${p} OR lower(dba_name) LIKE ${p})`
        })
        conditions.push(`(${clauses.join(' OR ')})`)
      }
    }

    let distanceSelect = `NULL::float8 AS distance_miles`
    if (centre) {
      const pLat = pushParam(centre.lat)
      const pLon = pushParam(centre.lon)
      const pRad = pushParam(radiusMiles)
      const haversine = `(
        3958.8 * 2 * asin(sqrt(
          power(sin(radians((latitude - ${pLat}) / 2)), 2) +
          cos(radians(${pLat})) * cos(radians(latitude)) *
          power(sin(radians((longitude - ${pLon}) / 2)), 2)
        ))
      )`
      distanceSelect = `${haversine} AS distance_miles`
      conditions.push(`latitude IS NOT NULL AND longitude IS NOT NULL`)
      conditions.push(`${haversine} <= ${pRad}`)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const sortBy = filters.sortBy ?? 'powerUnits'
    const sortOrder = filters.sortOrder ?? 'desc'
    const sortCol =
      sortBy === 'legalName' ? 'legal_name' :
      sortBy === 'phyState' ? 'phy_state' :
      sortBy === 'phyCity' ? 'phy_city' :
      'power_units'
    const orderClause = centre
      ? `ORDER BY distance_miles ASC, power_units DESC NULLS LAST`
      : `ORDER BY ${sortCol} ${sortOrder === 'asc' ? 'ASC' : 'DESC'} NULLS LAST, power_units DESC NULLS LAST`

    const sqlRows = `
      SELECT id, dot_number, mc_number, legal_name, dba_name,
             phy_street, phy_city, phy_state, phy_zip,
             phone, email, power_units, drivers, operating_status,
             cargo_carried, hm_flag, latitude, longitude,
             ${distanceSelect}
        FROM fmcsa_census_carriers
        ${where}
        ${orderClause}
        LIMIT ${pageSize} OFFSET ${offset}
    `
    const sqlCount = `SELECT COUNT(*)::int AS total FROM fmcsa_census_carriers ${where}`

    const pool = getFmcsaPool()
    const [rowsRes, countRes, datasetRes, syncRes] = await Promise.all([
      pool.query(sqlRows, params as never),
      pool.query<{ total: number }>(sqlCount, params as never),
      pool.query<{ total: number }>(`SELECT COUNT(*)::int AS total FROM fmcsa_census_carriers`),
      pool.query<{ last: Date | null }>(`SELECT MAX(synced_at) AS last FROM fmcsa_census_carriers`),
    ])

    const rows: FmcsaSearchResultRow[] = rowsRes.rows.map((r) => ({
      id: r.id,
      dotNumber: r.dot_number,
      mcNumber: r.mc_number,
      legalName: r.legal_name,
      dbaName: r.dba_name,
      phyStreet: r.phy_street,
      phyCity: r.phy_city,
      phyState: r.phy_state,
      phyZip: r.phy_zip,
      phone: r.phone,
      email: r.email,
      powerUnits: r.power_units,
      drivers: r.drivers,
      operatingStatus: r.operating_status,
      cargoCarried: Array.isArray(r.cargo_carried) ? r.cargo_carried : [],
      hmFlag: r.hm_flag === true,
      distanceMiles: r.distance_miles != null ? Number(r.distance_miles) : null,
      latitude: r.latitude != null ? Number(r.latitude) : null,
      longitude: r.longitude != null ? Number(r.longitude) : null,
    }))

    return NextResponse.json({
      success: true,
      data: {
        rows,
        total: countRes.rows[0]?.total ?? 0,
        page,
        pageSize,
        datasetSize: datasetRes.rows[0]?.total ?? 0,
        lastSyncedAt: syncRes.rows[0]?.last ? new Date(syncRes.rows[0].last).toISOString() : null,
        centerZip: centre
          ? { zip: centre.zip, lat: centre.lat, lon: centre.lon, city: centre.city, state: centre.state }
          : undefined,
      },
    })
  } catch (err) {
    console.error('[FMCSA Search] query failed:', err)
    return NextResponse.json(
      { success: false, error: 'FMCSA search failed. Please try again.' },
      { status: 500 }
    )
  }
}
