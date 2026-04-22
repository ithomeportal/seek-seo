/**
 * Teams webhook relay.
 *
 * Posts a credit-application summary + base64 PDF to an n8n workflow
 * (TEAMS_WEBHOOK_URL) which then:
 *   1. Uploads the PDF to SharePoint (BI reports folder)
 *   2. Posts an HTML message to the configured Teams chat with a link to the PDF
 *
 * The webhook URL and basic-auth creds live in Vercel env:
 *   TEAMS_WEBHOOK_URL       = https://n8n.unlk-repos.com/webhook/credit-application
 *   TEAMS_WEBHOOK_USERNAME  = basic-auth user configured in the n8n Webhook node
 *   TEAMS_WEBHOOK_PASSWORD  = basic-auth password
 *
 * If TEAMS_WEBHOOK_URL is not set, postToTeams() returns `{ ok: false, skipped: true }`
 * instead of throwing — the caller should treat this as a non-blocking notification.
 */

export interface TeamsCreditApplicationPayload {
  reference: string
  customerName: string
  customerPhone: string | null
  signatoryName: string
  signatoryEmail: string
  signatoryPhone: string | null
  entityType: string | null
  federalTaxId: string | null
  submittedAt: string // ISO
  summaryHtml: string
  pdfBase64: string
  pdfFilename: string
}

export interface TeamsPostResult {
  ok: boolean
  skipped?: boolean
  status?: number
  message?: string
}

export async function postToTeams(
  payload: TeamsCreditApplicationPayload
): Promise<TeamsPostResult> {
  const url = process.env.TEAMS_WEBHOOK_URL
  if (!url) {
    return { ok: false, skipped: true, message: 'TEAMS_WEBHOOK_URL not set' }
  }

  const username = process.env.TEAMS_WEBHOOK_USERNAME
  const password = process.env.TEAMS_WEBHOOK_PASSWORD
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (username && password) {
    headers['Authorization'] =
      'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return {
        ok: false,
        status: res.status,
        message: text.slice(0, 300) || res.statusText,
      }
    }
    return { ok: true, status: res.status }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : 'Unknown error posting to Teams webhook',
    }
  }
}
