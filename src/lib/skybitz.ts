/**
 * SkyBitz GPS API client — XML Legacy authentication
 *
 * Uses username/password query parameters against xml.skybitz.com.
 * OAuth2 was disabled by SkyBitz support (Leo) on 2026-04-02 when
 * switching the account to XML Legacy mode.
 */

export interface SkyBitzPosition {
  assetId: string
  latitude: number
  longitude: number
  speed: number | null
  heading: number | null
  battery: string | null
  externalPower: boolean | null
  landmark: string | null
  observedAt: string
  deviceSerial: string | null
}

interface CachedPositions {
  data: SkyBitzPosition[]
  fetchedAt: number
}

let cachedPositions: CachedPositions | null = null
const CACHE_TTL_MS = 60_000

function getConfig() {
  return {
    apiUrl: process.env.SKYBITZ_API_URL ?? '',
    xmlUsername: process.env.SKYBITZ_XML_USERNAME ?? '',
    xmlPassword: process.env.SKYBITZ_XML_PASSWORD ?? '',
  }
}

/**
 * Fetch all GPS positions from SkyBitz.
 * Returns null if not configured. Caches for 60s to respect rate limits.
 */
export async function fetchPositions(): Promise<SkyBitzPosition[] | null> {
  const { apiUrl, xmlUsername, xmlPassword } = getConfig()
  if (!apiUrl || !xmlUsername || !xmlPassword) return null

  if (cachedPositions && Date.now() - cachedPositions.fetchedAt < CACHE_TTL_MS) {
    return cachedPositions.data
  }

  const params = new URLSearchParams({
    version: '2.67',
    customer: xmlUsername,
    password: xmlPassword,
    assetid: 'ALL',
    sortby: '1',
  })

  const res = await fetch(`${apiUrl}/QueryPositions?${params}`)
  if (!res.ok) return null

  const text = await res.text()
  const errMatch = text.match(/<error>(\d+)<\/error>/)
  if (errMatch && errMatch[1] !== '0') return null

  const positions = parsePositionsXml(text)
  cachedPositions = { data: positions, fetchedAt: Date.now() }
  return positions
}

/** Parse SkyBitz XML response into structured positions */
function parsePositionsXml(xml: string): SkyBitzPosition[] {
  const positions: SkyBitzPosition[] = []

  const glsBlocks = xml.match(/<gls>[\s\S]*?<\/gls>/g)
  if (!glsBlocks) return positions

  for (const block of glsBlocks) {
    const get = (tag: string): string | null => {
      const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))
      return m ? m[1].trim() : null
    }

    const lat = get('latitude')
    const lng = get('longitude')
    if (!lat || !lng) continue

    positions.push({
      assetId: get('assetid') ?? '',
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      speed: get('speed') ? parseFloat(get('speed')!) : null,
      heading: get('headingindegrees')
        ? parseFloat(get('headingindegrees')!)
        : null,
      battery: get('battery'),
      externalPower: get('extpwr') === '1',
      landmark: get('geoname'),
      observedAt: get('time_iso8601') ?? get('time') ?? '',
      deviceSerial: get('mtsn'),
    })
  }

  return positions
}
