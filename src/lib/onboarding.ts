import { Resend } from 'resend'
import { query } from '@/lib/db'

export type OnboardingStatus =
  | 'created'
  | 'dl_submitted'
  | 'approved'
  | 'declined'
  | 'bundle_started'
  | 'completed'

export interface OnboardingApplicationRow {
  id: number
  email: string
  customer_id: number | null
  status: OnboardingStatus
  reference: string | null

  company_name: string | null
  contact_first_name: string | null
  contact_last_name: string | null
  phone: string | null

  dl_url: string | null
  dl_filename: string | null
  dl_uploaded_at: string | null

  reviewed_by: string | null
  reviewed_at: string | null
  decline_reason: string | null

  ach_bank_name: string | null
  ach_routing_last4: string | null
  ach_account_last4: string | null
  ach_account_type: string | null
  ach_voided_check_url: string | null
  ach_authorized_name: string | null
  ach_authorized_at: string | null

  lease_signed_name: string | null
  lease_signed_at: string | null

  guaranty_signed_name: string | null
  guaranty_signed_at: string | null

  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface OnboardingApplication {
  id: number
  email: string
  customerId: number | null
  status: OnboardingStatus
  reference: string

  companyName: string | null
  contactFirstName: string | null
  contactLastName: string | null
  phone: string | null

  dlUrl: string | null
  dlFilename: string | null
  dlUploadedAt: string | null

  reviewedBy: string | null
  reviewedAt: string | null
  declineReason: string | null

  achBankName: string | null
  achRoutingLast4: string | null
  achAccountLast4: string | null
  achAccountType: string | null
  achVoidedCheckUrl: string | null
  achAuthorizedName: string | null
  achAuthorizedAt: string | null

  leaseSignedName: string | null
  leaseSignedAt: string | null

  guarantySignedName: string | null
  guarantySignedAt: string | null

  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export function rowToApplication(row: OnboardingApplicationRow): OnboardingApplication {
  return {
    id: row.id,
    email: row.email,
    customerId: row.customer_id,
    status: row.status,
    reference: row.reference ?? '',
    companyName: row.company_name,
    contactFirstName: row.contact_first_name,
    contactLastName: row.contact_last_name,
    phone: row.phone,
    dlUrl: row.dl_url,
    dlFilename: row.dl_filename,
    dlUploadedAt: row.dl_uploaded_at,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    declineReason: row.decline_reason,
    achBankName: row.ach_bank_name,
    achRoutingLast4: row.ach_routing_last4,
    achAccountLast4: row.ach_account_last4,
    achAccountType: row.ach_account_type,
    achVoidedCheckUrl: row.ach_voided_check_url,
    achAuthorizedName: row.ach_authorized_name,
    achAuthorizedAt: row.ach_authorized_at,
    leaseSignedName: row.lease_signed_name,
    leaseSignedAt: row.lease_signed_at,
    guarantySignedName: row.guaranty_signed_name,
    guarantySignedAt: row.guaranty_signed_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getApplicationByEmail(
  email: string
): Promise<OnboardingApplication | null> {
  const result = await query<OnboardingApplicationRow>(
    `SELECT * FROM customer_onboarding_applications
      WHERE LOWER(email) = LOWER($1)
      ORDER BY created_at DESC
      LIMIT 1`,
    [email]
  )
  return result.rows[0] ? rowToApplication(result.rows[0]) : null
}

export async function getApplicationById(
  id: number
): Promise<OnboardingApplication | null> {
  const result = await query<OnboardingApplicationRow>(
    `SELECT * FROM customer_onboarding_applications WHERE id = $1`,
    [id]
  )
  return result.rows[0] ? rowToApplication(result.rows[0]) : null
}

export function nextReference(): string {
  const year = new Date().getFullYear()
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return `OB-${year}-${seq}`
}

export async function createApplication(email: string): Promise<OnboardingApplication> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const reference = nextReference()
    try {
      const result = await query<OnboardingApplicationRow>(
        `INSERT INTO customer_onboarding_applications (email, status, reference)
         VALUES ($1, 'created', $2)
         RETURNING *`,
        [email, reference]
      )
      return rowToApplication(result.rows[0])
    } catch (err) {
      const code = (err as { code?: string }).code
      if (code !== '23505') throw err
    }
  }
  throw new Error('Could not generate a unique application reference after 5 attempts.')
}

export function bundleProgress(app: OnboardingApplication): {
  ach: boolean
  lease: boolean
  guaranty: boolean
  completed: number
  total: number
  isComplete: boolean
} {
  const ach = app.achAuthorizedAt !== null
  const lease = app.leaseSignedAt !== null
  const guaranty = app.guarantySignedAt !== null
  const completed = [ach, lease, guaranty].filter(Boolean).length
  return { ach, lease, guaranty, completed, total: 3, isComplete: completed === 3 }
}

export async function maybeMarkCompleted(email: string): Promise<OnboardingApplication | null> {
  const app = await getApplicationByEmail(email)
  if (!app) return null
  const progress = bundleProgress(app)
  if (progress.isComplete && app.status !== 'completed') {
    await query(
      `UPDATE customer_onboarding_applications
          SET status = 'completed',
              completed_at = NOW(),
              updated_at = NOW()
        WHERE id = $1`,
      [app.id]
    )
    await notifySeekOfCompletion(app.reference, email, app.companyName)
    return await getApplicationByEmail(email)
  }
  return app
}

async function notifySeekOfCompletion(
  reference: string,
  email: string,
  companyName: string | null
): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return
  const resend = new Resend(resendKey)
  try {
    await resend.emails.send({
      from: 'SEEK Equipment <noreply@unilinkportal.com>',
      to: 'rodney@seekequipment.com',
      cc: 'emendoza@seekequipment.com',
      subject: `Onboarding complete — ${companyName ?? email} (${reference})`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px;">
          <h2 style="color: #35668d;">Onboarding Complete</h2>
          <p>${companyName ?? email} has signed all required documents.</p>
          <ul>
            <li><strong>Reference:</strong> ${reference}</li>
            <li><strong>Email:</strong> ${email}</li>
          </ul>
          <p>Review the completed application in the SEEK admin portal.</p>
        </div>
      `,
    })
  } catch {
    // Best effort
  }
}

export async function sendSignedDocumentEmail(opts: {
  email: string
  reference: string
  docName: string
  signedName: string
  pdfBytes: Uint8Array
  filename: string
}): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return
  const resend = new Resend(resendKey)
  try {
    await resend.emails.send({
      from: 'SEEK Equipment <noreply@unilinkportal.com>',
      to: opts.email,
      cc: 'rodney@seekequipment.com',
      subject: `Signed ${opts.docName} — SEEK Equipment (${opts.reference})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #35668d;">Your ${opts.docName} has been signed</h2>
          <p>Thank you, ${opts.signedName}. Your signed ${opts.docName} is attached for your records.</p>
          <p><strong>Reference:</strong> ${opts.reference}</p>
          <p>A copy has also been sent to SEEK Equipment. You can view the status of your application at any time by logging back into the customer portal.</p>
          <hr style="border:none; border-top:1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color:#9ca3af; font-size:12px;">SEEK Equipment Rentals &bull; info@seekequipment.com &bull; (210) 802-0000</p>
        </div>
      `,
      attachments: [
        {
          filename: opts.filename,
          content: Buffer.from(opts.pdfBytes),
        },
      ],
    })
  } catch {
    // Best effort
  }
}
