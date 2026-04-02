/**
 * SkyBitz GPS API client
 *
 * OAuth2 flow:
 *   1. POST to token URL with client_credentials grant
 *   2. Use bearer token to call the SkyBitz data API
 *
 * The data API URL (SKYBITZ_API_URL) must be provided by SkyBitz support.
 * Until then, this module returns null from fetchPositions().
 */

interface SkyBitzToken {
  accessToken: string
  expiresAt: number
}

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

let cachedToken: SkyBitzToken | null = null

function getConfig() {
  return {
    clientId: process.env.SKYBITZ_CLIENT_ID ?? '',
    clientSecret: process.env.SKYBITZ_CLIENT_SECRET ?? '',
    tokenUrl:
      process.env.SKYBITZ_TOKEN_URL ??
      'https://prodssoidp.skybitz.com/oauth2/token',
    apiUrl: process.env.SKYBITZ_API_URL ?? '',
  }
}

export async function getAccessToken(): Promise<string | null> {
  const { clientId, clientSecret, tokenUrl } = getConfig()
  if (!clientId || !clientSecret) return null

  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.accessToken
  }

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!res.ok) return null

  const data = (await res.json()) as {
    access_token: string
    expires_in: number
  }
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 30) * 1000,
  }
  return cachedToken.accessToken
}

/**
 * Fetch all GPS positions from SkyBitz.
 * Returns null if the API URL is not configured yet.
 */
export async function fetchPositions(): Promise<SkyBitzPosition[] | null> {
  const { apiUrl } = getConfig()
  if (!apiUrl) return null

  const token = await getAccessToken()
  if (!token) return null

  const res = await fetch(`${apiUrl}/QueryPositions?assetid=ALL&sortby=1`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) return null

  const text = await res.text()
  return parsePositionsXml(text)
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
