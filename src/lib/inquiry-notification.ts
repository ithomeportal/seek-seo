import { Resend } from 'resend'
import { isOrgEmail } from './allowed-domains'

/**
 * Staff notification for a public Contact or Quote submission.
 *
 * ⚠ Why this exists. Both routes saved the submission to `contact_submissions`
 * and then did nothing — the only trace was a `// TODO: Integrate with email
 * service (Resend)` and a row that somebody had to think to go and look at, in
 * the admin Inquiries tab. A quote request could sit there indefinitely with the
 * customer already told "we will get back to you within 2 business hours".
 *
 * ⚠ This is a STAFF-facing send and is guarded by the org-domain allowlist —
 * see `allowed-domains.ts`. It deliberately does NOT acknowledge the submitter:
 * these are public, unauthenticated forms, and emailing the address in the body
 * would turn them into a relay to arbitrary recipients. The four sends that DO
 * legitimately reach outsiders are enumerated in `allowed-domains.ts`; do not
 * add a fifth here without that same deliberate reasoning.
 *
 * `replyTo` carries the submitter, so staff still answer with one click.
 */

const DEFAULT_TO = 'info@seekequipment.com'
const DEFAULT_CC = 'rodney@seekequipment.com'
const FROM_ADDRESS = 'SEEK Equipment <noreply@unilinkportal.com>'
const ADMIN_INQUIRIES_URL = 'https://www.seekequipment.com/admin/dashboard?tab=inquiries'

export type InquiryKind = 'contact' | 'quote'

export interface InquiryNotification {
  /** `contact_submissions.id` — the durable record this email is about. */
  id: number
  kind: InquiryKind
  name: string
  email: string
  phone: string | null
  company: string | null
  message: string | null
  submittedAt: Date
  /** Quote-only fields. */
  trailerType?: string | null
  quantity?: number | string | null
  duration?: string | null
  startDate?: string | null
}

export interface NotifyResult {
  ok: boolean
  /** True when RESEND_API_KEY is absent — a configuration gap, not a failure. */
  skipped?: boolean
  error?: string
}

/**
 * Resolve a recipient list from an env var.
 *
 * ⚠ Two rules, both learned the hard way:
 * 1. A blank value falls back to the default — a typo in the dashboard must not
 *    silence the notification.
 * 2. `.trim()` at the point of use. `echo "$V" | vercel env add` stores a
 *    trailing newline, and platform hygiene cannot be verified from in here.
 */
function recipients(envVar: string, fallback: string): string[] {
  const raw = (process.env[envVar] ?? '').trim()
  const list = (raw === '' ? fallback : raw)
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter((s) => s !== '')

  // The allowlist is a real gate here, not belt-and-braces: unlike the other
  // staff sends these addresses come from the environment, so a bad value could
  // otherwise point customer enquiries at an outside mailbox.
  const orgOnly = list.filter(isOrgEmail)
  if (orgOnly.length !== list.length) {
    // Log the DOMAIN, never the address — see SPEC-EMAIL-DOMAIN-POLICY.md.
    const rejected = [...new Set(
      list.filter((a) => !isOrgEmail(a)).map((a) => a.split('@')[1] ?? '(none)')
    )]
    console.error(
      `[inquiry-notification] ${envVar} contains non-company domain(s): ${rejected.join(', ')} — dropped`
    )
  }
  // Falling back rather than sending to nobody: an env that fails the guard is a
  // misconfiguration, and a silent non-send is the failure this module exists to
  // prevent.
  return orgOnly.length > 0 ? orgOnly : fallback.split(/[,;]/).map((s) => s.trim())
}

/**
 * `sand-chassis` → `Sand Chassis`, `12-month` → `12 Month`.
 *
 * Derived rather than mapped: the labels in `QuoteForm.tsx` live in a client
 * component, and a second copy of them here would drift the first time an
 * option is renamed. Every current `trailerType` and `duration` value in
 * `quoteSchema` de-slugs correctly.
 */
function humanize(value: string | null | undefined): string | null {
  if (!value) return null
  return value
    .split('-')
    .filter((w) => w !== '')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Mirrors the helper in gps-watchdog-email.ts — user text goes into HTML here. */
function escapeHtml(value: string | null | undefined): string {
  if (!value) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function row(label: string, value: string | null | undefined): string {
  if (value === null || value === undefined || String(value).trim() === '') return ''
  return `<tr>
    <td style="padding:6px 10px;border-bottom:1px solid #eef0f3;color:#6b7280;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:6px 10px;border-bottom:1px solid #eef0f3;color:#111827;font-weight:600;">${escapeHtml(String(value))}</td>
  </tr>`
}

function inquiryHtml(i: InquiryNotification): string {
  const heading = i.kind === 'quote' ? 'New quote request' : 'New contact inquiry'
  const submitted = i.submittedAt.toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#111827;max-width:640px;">
    <div style="background:#ee5519;color:#fff;padding:12px 16px;border-radius:6px 6px 0 0;">
      <div style="font-size:16px;font-weight:700;">${escapeHtml(heading)}</div>
      <div style="font-size:11px;opacity:.9;">${escapeHtml(submitted)} CT · reference #${i.id}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #eef0f3;border-top:none;">
      ${row('Name', i.name)}
      ${row('Company', i.company)}
      ${row('Email', i.email)}
      ${row('Phone', i.phone)}
      ${row('Trailer type', humanize(i.trailerType))}
      ${row('Quantity', i.quantity === null || i.quantity === undefined ? null : String(i.quantity))}
      ${row('Duration', humanize(i.duration))}
      ${row('Start date', i.startDate)}
    </table>
    ${
      i.message && i.message.trim() !== ''
        ? `<div style="margin-top:12px;padding:10px 12px;background:#f9fafb;border:1px solid #eef0f3;border-radius:4px;">
             <div style="font-size:10px;text-transform:uppercase;letter-spacing:.4px;color:#6b7280;margin-bottom:4px;">${
               i.kind === 'quote' ? 'Details' : 'Message'
             }</div>
             <div style="white-space:pre-wrap;line-height:1.5;">${escapeHtml(i.message)}</div>
           </div>`
        : ''
    }
    <p style="margin:14px 0 0;color:#6b7280;font-size:11px;">
      Reply to this email to answer ${escapeHtml(i.name)} directly, or open it in the
      <a href="${ADMIN_INQUIRIES_URL}" style="color:#35668d;">Inquiries tab</a>.
      The submission is saved either way.
    </p>
  </div>`
}

function inquiryText(i: InquiryNotification): string {
  const lines = [
    i.kind === 'quote' ? 'New quote request' : 'New contact inquiry',
    `Reference #${i.id} · ${i.submittedAt.toISOString()}`,
    '',
    `Name:    ${i.name}`,
    i.company ? `Company: ${i.company}` : '',
    `Email:   ${i.email}`,
    i.phone ? `Phone:   ${i.phone}` : '',
    i.trailerType ? `Trailer: ${humanize(i.trailerType)}` : '',
    i.quantity ? `Qty:     ${i.quantity}` : '',
    i.duration ? `Duration: ${humanize(i.duration)}` : '',
    i.startDate ? `Start:   ${i.startDate}` : '',
    '',
    i.message ? `${i.kind === 'quote' ? 'Details' : 'Message'}:\n${i.message}` : '',
    '',
    ADMIN_INQUIRIES_URL,
  ]
  return lines.filter((l) => l !== '').join('\n')
}

/**
 * Email SEEK about a new public submission.
 *
 * ⚠ NEVER throws, and the caller must NEVER fail the request on the result.
 * The row is already committed to `contact_submissions` before this runs, so a
 * dead Resend key is a missed notification, not lost data — and telling a
 * customer "something went wrong" after we successfully took their enquiry is
 * strictly worse than telling staff nothing. The caller logs `!ok` instead.
 */
export async function notifySeekOfInquiry(
  input: InquiryNotification
): Promise<NotifyResult> {
  const resendKey = (process.env.RESEND_API_KEY ?? '').trim()
  if (resendKey === '') {
    return { ok: false, skipped: true, error: 'RESEND_API_KEY is not configured' }
  }

  const label = input.company?.trim() || input.name
  const subject =
    input.kind === 'quote'
      ? `New quote request — ${label}`
      : `New contact inquiry — ${label}`

  try {
    const resend = new Resend(resendKey)
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: recipients('INQUIRY_ALERT_TO', DEFAULT_TO),
      cc: recipients('INQUIRY_ALERT_CC', DEFAULT_CC),
      // The submitter is a reply-to, never a recipient — see the note at the
      // top of this file.
      replyTo: input.email,
      subject,
      html: inquiryHtml(input),
      text: inquiryText(input),
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
