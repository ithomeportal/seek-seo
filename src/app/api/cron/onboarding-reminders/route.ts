import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { query } from '@/lib/db'
import { rowToApplication, type OnboardingApplicationRow, type OnboardingApplication } from '@/lib/onboarding'

type ReminderKind =
  | 'dl_not_uploaded'
  | 'bundle_not_started'
  | 'bundle_partial'
  | 'recurring_72h'

const PORTAL_URL = 'https://www.seekequipment.com/client-portal'

function ageHours(date: string | null): number {
  if (!date) return Infinity
  const t = new Date(date).getTime()
  if (Number.isNaN(t)) return Infinity
  return (Date.now() - t) / (1000 * 60 * 60)
}

function pickReminder(app: OnboardingApplication): ReminderKind | null {
  const lastSent = ageHours(app.updatedAt) // proxy floor — we compare specific timestamps below
  const sinceLastReminder = ageHours((app as unknown as { lastReminderSentAt?: string }).lastReminderSentAt ?? null)

  // Status-driven primary reminders
  if (app.status === 'created' || app.status === 'dl_submitted') {
    // We treat "dl not uploaded" + "started not submitted" as one combined reminder.
    if (app.status === 'created' && ageHours(app.createdAt) >= 48 && sinceLastReminder >= 24) {
      return 'dl_not_uploaded'
    }
    // App is "in progress" of DL upload but somehow stalled — covered by recurring rule below.
  }

  if (app.status === 'approved') {
    if (ageHours(app.reviewedAt) >= 48 && sinceLastReminder >= 24) {
      return 'bundle_not_started'
    }
  }

  if (app.status === 'bundle_started') {
    // Some docs done, some not. Use updated_at as a proxy for last activity.
    if (ageHours(app.updatedAt) >= 24 && sinceLastReminder >= 24) {
      return 'bundle_partial'
    }
  }

  // Recurring 72h reminder for any incomplete state (not declined, not completed)
  const incomplete =
    app.status === 'created' ||
    app.status === 'dl_submitted' ||
    app.status === 'approved' ||
    app.status === 'bundle_started'
  if (incomplete && sinceLastReminder >= 72) {
    return 'recurring_72h'
  }

  // Suppress unused linter warning
  void lastSent
  return null
}

function describeMissing(app: OnboardingApplication): string[] {
  const missing: string[] = []
  if (app.status === 'created' || app.status === 'dl_submitted') {
    if (!app.dlUploadedAt) missing.push('Driver’s License photo')
    return missing
  }
  if (!app.achAuthorizedAt) missing.push('ACH Authorization')
  if (!app.leaseSignedAt) missing.push('Equipment Rental Agreement')
  if (!app.guarantySignedAt) missing.push('Personal Guaranty')
  return missing
}

function reminderSubject(kind: ReminderKind, reference: string): string {
  switch (kind) {
    case 'dl_not_uploaded':
      return `Reminder: Upload your Driver’s License to start your SEEK application (${reference})`
    case 'bundle_not_started':
      return `Reminder: Your SEEK Equipment documents are ready to sign (${reference})`
    case 'bundle_partial':
      return `Reminder: A few SEEK documents are still pending your signature (${reference})`
    case 'recurring_72h':
      return `Reminder: Your SEEK Equipment onboarding is incomplete (${reference})`
  }
}

function reminderHtml(
  kind: ReminderKind,
  reference: string,
  missing: string[]
): string {
  const intro = (() => {
    switch (kind) {
      case 'dl_not_uploaded':
        return 'It looks like you started a SEEK Equipment application but haven’t uploaded your Driver’s License yet. Once we have it on file, we can review and approve your account.'
      case 'bundle_not_started':
        return 'Your application has been approved! The last step is to sign three short documents in your portal so we can finalize your account.'
      case 'bundle_partial':
        return 'You’re almost done — just a couple of documents left to sign.'
      case 'recurring_72h':
        return 'We’re keeping your SEEK Equipment onboarding open so you can pick it up whenever you’re ready. Here’s what’s still outstanding:'
    }
  })()

  const list =
    missing.length === 0
      ? ''
      : `<ul>${missing.map((m) => `<li>${m}</li>`).join('')}</ul>`

  return `
    <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #35668d;">SEEK Equipment — Onboarding reminder</h2>
      <p>${intro}</p>
      ${list}
      <p style="margin: 24px 0;">
        <a href="${PORTAL_URL}"
           style="background:#ee5519;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
          Continue in the customer portal
        </a>
      </p>
      <p><strong>Reference:</strong> ${reference}</p>
      <hr style="border:none; border-top:1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color:#9ca3af; font-size:12px;">
        SEEK Equipment Rentals &bull; info@seekequipment.com &bull; (210) 802-0000<br/>
        Reply to this email if you have any questions, or call us during business hours.
      </p>
    </div>
  `
}

async function isAuthorized(request: Request): Promise<boolean> {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    // No secret configured — only allow Vercel internal cron user-agent.
    const ua = request.headers.get('user-agent') ?? ''
    return ua.includes('vercel-cron')
  }
  const auth = request.headers.get('authorization')
  if (auth === `Bearer ${expected}`) return true
  const headerSecret = request.headers.get('x-cron-secret')
  return headerSecret === expected
}

export async function GET(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  const result = await query<OnboardingApplicationRow>(
    `SELECT * FROM customer_onboarding_applications
      WHERE status IN ('created','dl_submitted','approved','bundle_started')
      ORDER BY created_at ASC
      LIMIT 500`
  )

  const resendKey = process.env.RESEND_API_KEY
  const resend = resendKey ? new Resend(resendKey) : null
  const report: Array<{ id: number; email: string; kind: ReminderKind; sent: boolean }> = []

  for (const row of result.rows) {
    const app = rowToApplication(row)
    // Carry last_reminder_sent_at through for the picker.
    const enriched = Object.assign(app, {
      lastReminderSentAt: (row as unknown as { last_reminder_sent_at: string | null }).last_reminder_sent_at,
    })
    const kind = pickReminder(enriched as OnboardingApplication)
    if (!kind) continue

    const missing = describeMissing(app)
    let sent = false
    if (resend) {
      try {
        await resend.emails.send({
          from: 'SEEK Equipment <noreply@unilinkportal.com>',
          to: app.email,
          subject: reminderSubject(kind, app.reference),
          html: reminderHtml(kind, app.reference, missing),
        })
        sent = true
      } catch {
        sent = false
      }
    }

    await query(
      `UPDATE customer_onboarding_applications
          SET last_reminder_sent_at = NOW(),
              last_reminder_kind = $1,
              reminder_count = reminder_count + 1
        WHERE id = $2`,
      [kind, app.id]
    )

    report.push({ id: app.id, email: app.email, kind, sent })
  }

  return NextResponse.json({
    success: true,
    processed: report.length,
    report,
  })
}
