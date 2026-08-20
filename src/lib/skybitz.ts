/**
 * SkyBitz GPS API client — XML Legacy authentication
 *
 * Uses username/password query parameters against xml.skybitz.com.
 * OAuth2 was disabled by SkyBitz support (Leo) on 2026-04-02 when
 * switching the account to XML Legacy mode.
 *
 * ⚠ Every env value is `.trim()`ed and that is LOAD-BEARING, not cosmetic.
 * All three production vars were stored with a trailing newline (set on
 * 2026-04-02, almost certainly `echo "…" | vercel env add` without `-n`).
 * URLSearchParams encodes that `\n` as `%0A` *into the credentials*, so
 * SkyBitz answered `<error>1</error> Invalid login credentials` on every
 * single call. The feed was dead from 2026-04-02 until 2026-08-20 and the
 * UI reported it as "not configured". Never drop the trim.
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
  location: string | null
  observedAt: string
  deviceSerial: string | null
}

/**
 * Why this is a discriminated union rather than `SkyBitzPosition[] | null`:
 * the previous signature collapsed "not configured", "HTTP error",
 * "SkyBitz rejected us" and "no data" into a single `null`, so the caller
 * could only ever print "not configured" — which is exactly what masked a
 * four-month credential outage. Every failure now carries its own reason.
 */
export type SkyBitzResult =
  | { ok: true; positions: SkyBitzPosition[] }
  | { ok: false; reason: 'not_configured'; detail: string }
  | { ok: false; reason: 'http_error'; detail: string }
  | { ok: false; reason: 'skybitz_error'; detail: string }
  | { ok: false; reason: 'network_error'; detail: string }
  | { ok: false; reason: 'no_positions'; detail: string }

interface CachedPositions {
  data: SkyBitzPosition[]
  fetchedAt: number
}

let cachedPositions: CachedPositions | null = null
const CACHE_TTL_MS = 60_000

function getConfig() {
  return {
    apiUrl: (process.env.SKYBITZ_API_URL ?? '').trim(),
    xmlUsername: (process.env.SKYBITZ_XML_USERNAME ?? '').trim(),
    xmlPassword: (process.env.SKYBITZ_XML_PASSWORD ?? '').trim(),
  }
}

/** True when all three XML Legacy credentials are present. */
export function isConfigured(): boolean {
  const { apiUrl, xmlUsername, xmlPassword } = getConfig()
  return apiUrl !== '' && xmlUsername !== '' && xmlPassword !== ''
}

/**
 * Fetch all GPS positions from SkyBitz.
 * Caches for 60s to respect rate limits. Failures are never cached.
 */
export async function fetchPositions(): Promise<SkyBitzResult> {
  const { apiUrl, xmlUsername, xmlPassword } = getConfig()

  const missing = [
    apiUrl === '' && 'SKYBITZ_API_URL',
    xmlUsername === '' && 'SKYBITZ_XML_USERNAME',
    xmlPassword === '' && 'SKYBITZ_XML_PASSWORD',
  ].filter(Boolean)

  if (missing.length > 0) {
    return {
      ok: false,
      reason: 'not_configured',
      detail: `Missing environment variable(s): ${missing.join(', ')}`,
    }
  }

  if (cachedPositions && Date.now() - cachedPositions.fetchedAt < CACHE_TTL_MS) {
    return { ok: true, positions: cachedPositions.data }
  }

  const params = new URLSearchParams({
    version: '2.67',
    customer: xmlUsername,
    password: xmlPassword,
    assetid: 'ALL',
    sortby: '1',
  })

  let res: Response
  try {
    res = await fetch(`${apiUrl}/QueryPositions?${params}`)
  } catch (err) {
    return {
      ok: false,
      reason: 'network_error',
      detail: err instanceof Error ? err.message : 'Request to SkyBitz failed',
    }
  }

  if (!res.ok) {
    return {
      ok: false,
      reason: 'http_error',
      detail: `SkyBitz returned HTTP ${res.status} ${res.statusText}`,
    }
  }

  const text = await res.text()

  // SkyBitz answers 200 OK even when it rejects the request; the real status
  // lives in <error>. Anything non-zero is a failure, and <errorText> tells
  // you which — "Invalid login credentials" for a bad username/password.
  const errCode = text.match(/<error>(\d+)<\/error>/)?.[1]
  if (errCode && errCode !== '0') {
    const errText = text.match(/<errorText>([\s\S]*?)<\/errorText>/)?.[1]?.trim()
    return {
      ok: false,
      reason: 'skybitz_error',
      detail: `SkyBitz error ${errCode}${errText ? `: ${errText}` : ''}`,
    }
  }

  const positions = parsePositionsXml(text)
  if (positions.length === 0) {
    return {
      ok: false,
      reason: 'no_positions',
      detail: 'SkyBitz accepted the request but returned no asset positions',
    }
  }

  cachedPositions = { data: positions, fetchedAt: Date.now() }
  return { ok: true, positions }
}

/**
 * SkyBitz sends `<time>` as `YYYY/MM/DD HH:MM:SS` in UTC, with no timezone
 * marker and no `time_iso8601` element (check the inline DTD — it does not
 * exist). Postgres would accept the slash form, but only by guessing the
 * server's timezone, so normalise to an explicit UTC ISO string here.
 */
function toIsoUtc(raw: string | null): string {
  if (!raw) return ''
  const m = raw
    .trim()
    .match(/^(\d{4})\/(\d{2})\/(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/)
  if (!m) return raw.trim()
  const [, y, mo, d, h, mi, s] = m
  return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`
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

    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue

    const geoname = get('geoname')
    const state = get('state')
    const location = [geoname, state].filter(Boolean).join(', ') || null

    positions.push({
      assetId: get('assetid') ?? '',
      latitude,
      longitude,
      speed: get('speed') ? parseFloat(get('speed')!) : null,
      heading: get('headingindegrees')
        ? parseFloat(get('headingindegrees')!)
        : null,
      battery: get('battery'),
      externalPower: get('extpwr') === '1',
      landmark: geoname,
      location,
      observedAt: toIsoUtc(get('time')),
      deviceSerial: get('mtsn'),
    })
  }

  return positions
}

/**
 * Normalise an asset/device id for matching.
 *
 * SkyBitz and the fleet table disagree about zero-padding: the feed sends
 * `TC015`/`TC025`/`TC030`…, while `fleet_units` stores `TC15`/`TC25`/`TC30`…
 * An exact `WHERE skybitz_device_id = $1` therefore discarded seven tank
 * trailers' positions silently, forever. Uppercase and strip leading zeros
 * from the numeric run so both spellings land on one key (`TC015` and `TC15`
 * both become `TC15`). Trailing revision letters are preserved (`CH090b` →
 * `CH90B`) because they distinguish real, separate devices.
 */
export function normalizeAssetId(id: string): string {
  return id.trim().toUpperCase().replace(/([A-Z]+)0+(\d)/g, '$1$2')
}
