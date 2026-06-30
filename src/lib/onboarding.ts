import { Resend } from 'resend'
import { query } from '@/lib/db'
import { postOnboardingDocumentToTeams } from '@/lib/teams-webhook'

// 'approved' | 'declined' | 'bundle_started' are legacy values from the old
// admin-gated e-sign flow — no longer written, kept so old rows still type-check.
export type OnboardingStatus =
  | 'created'
  | 'dl_submitted'
  | 'approved'
  | 'declined'
  | 'bundle_started'
  | 'completed'

/** A single uploaded Certificate of Insurance file. */
export interface CoiDocument {
  url: string
  filename: string | null
  uploadedAt: string
}

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
  ach_voided_check_uploaded_at: string | null
  ach_authorized_name: string | null
  ach_authorized_at: string | null
  ach_pdf_url: string | null

  coi_documents: CoiDocument[] | null
  coi_uploaded_at: string | null

  lease_signed_name: string | null
  lease_signed_at: string | null
  lease_pdf_url: string | null

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
  achVoidedCheckUploadedAt: string | null
  achAuthorizedName: string | null
  achAuthorizedAt: string | null
  achPdfUrl: string | null

  coiDocuments: CoiDocument[]
  coiUploadedAt: string | null

  leaseSignedName: string | null
  leaseSignedAt: string | null
  leasePdfUrl: string | null

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
    achVoidedCheckUploadedAt: row.ach_voided_check_uploaded_at,
    achAuthorizedName: row.ach_authorized_name,
    achAuthorizedAt: row.ach_authorized_at,
    achPdfUrl: row.ach_pdf_url,
    coiDocuments: Array.isArray(row.coi_documents) ? row.coi_documents : [],
    coiUploadedAt: row.coi_uploaded_at,
    leaseSignedName: row.lease_signed_name,
    leaseSignedAt: row.lease_signed_at,
    leasePdfUrl: row.lease_pdf_url,
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

export function sectionProgress(app: OnboardingApplication): {
  dl: boolean
  ach: boolean
  lease: boolean
  coi: boolean
  completed: number
  total: number
  isComplete: boolean
} {
  const dl = app.dlUploadedAt !== null
  // ACH is only complete once the authorization is submitted AND the voided
  // check / deposit slip has been uploaded (Bruno's 2026-06-09 requirement).
  const ach = app.achAuthorizedAt !== null && app.achVoidedCheckUrl !== null
  const lease = app.leaseSignedAt !== null
  // COI is OPTIONAL — tracked for its own sidebar checkmark but NOT counted
  // toward completion (Bruno's 2026-06-09 follow-up).
  const coi = app.coiDocuments.length > 0
  const completed = [dl, ach, lease].filter(Boolean).length
  return { dl, ach, lease, coi, completed, total: 3, isComplete: completed === 3 }
}

/** Shape of an application as exposed to the signed-in portal user. */
export function publicView(app: OnboardingApplication) {
  const progress = sectionProgress(app)
  return {
    id: app.id,
    reference: app.reference,
    status: app.status,
    companyName: app.companyName,
    contactFirstName: app.contactFirstName,
    contactLastName: app.contactLastName,
    phone: app.phone,
    dlUploadedAt: app.dlUploadedAt,
    dlFilename: app.dlFilename,
    achAuthorizedAt: app.achAuthorizedAt,
    achVoidedCheckUrl: app.achVoidedCheckUrl,
    achVoidedCheckUploadedAt: app.achVoidedCheckUploadedAt,
    leaseSignedAt: app.leaseSignedAt,
    guarantySignedAt: app.guarantySignedAt,
    coiDocuments: app.coiDocuments,
    coiUploadedAt: app.coiUploadedAt,
    completedAt: app.completedAt,
    createdAt: app.createdAt,
    progress,
  }
}

export async function maybeMarkCompleted(email: string): Promise<OnboardingApplication | null> {
  const app = await getApplicationByEmail(email)
  if (!app) return null
  const progress = sectionProgress(app)
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

/**
 * Emails a signed onboarding document (ACH or lease & guaranty) to SEEK
 * (rodney cc emendoza) + an acknowledgment copy to the customer, then relays
 * it to the Teams/n8n webhook (non-blocking). Mirrors the credit-application
 * delivery flow.
 */
export async function sendOnboardingDocument(input: {
  documentType: 'ach' | 'lease'
  documentLabel: string
  reference: string
  email: string
  companyName: string | null
  pdfBytes: Uint8Array
  submittedAt: Date
}): Promise<void> {
  const { documentType, documentLabel, reference, email, companyName, pdfBytes, submittedAt } =
    input
  const pdfBase64 = Buffer.from(pdfBytes).toString('base64')
  const pdfFilename = `${documentType === 'ach' ? 'ach-authorization' : 'lease-agreement'}-${reference}.pdf`
  const who = companyName ?? email

  const summaryHtml = `
    <div style="font-family: Arial, sans-serif; padding: 24px;">
      <h2 style="color: #35668d;">${documentLabel} Signed</h2>
      <p>${who} signed the ${documentLabel.toLowerCase()} in the onboarding portal. The signed PDF is attached.</p>
      <ul>
        <li><strong>Reference:</strong> ${reference}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Company:</strong> ${companyName ?? '—'}</li>
        <li><strong>Signed:</strong> ${submittedAt.toLocaleString('en-US')}</li>
      </ul>
    </div>
  `

  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    const resend = new Resend(resendKey)
    try {
      await resend.emails.send({
        from: 'SEEK Equipment <noreply@unilinkportal.com>',
        to: 'rodney@seekequipment.com',
        cc: 'emendoza@seekequipment.com',
        replyTo: email,
        subject: `${documentLabel} signed — ${who} (${reference})`,
        html: summaryHtml,
        attachments: [{ filename: pdfFilename, content: pdfBase64 }],
      })
      await resend.emails.send({
        from: 'SEEK Equipment <noreply@unilinkportal.com>',
        to: email,
        subject: `Your ${documentLabel} — SEEK Equipment (${reference})`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px;">
            <h2 style="color: #35668d;">${documentLabel} Received</h2>
            <p>Thank you. We have received your signed ${documentLabel.toLowerCase()}. A copy is attached for your records.</p>
            <p><strong>Reference:</strong> ${reference}</p>
          </div>
        `,
        attachments: [{ filename: pdfFilename, content: pdfBase64 }],
      })
    } catch {
      // Best effort — completion is still recorded in the DB.
    }
  }

  try {
    await postOnboardingDocumentToTeams({
      kind: 'onboarding-document',
      documentType,
      documentLabel,
      reference,
      companyName,
      applicantEmail: email,
      submittedAt: submittedAt.toISOString(),
      summaryHtml,
      pdfBase64,
      pdfFilename,
    })
  } catch {
    // Non-blocking relay.
  }
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
          <p>${companyName ?? email} has completed all onboarding sections (driver's license, ACH authorization, lease agreement &amp; guaranty).</p>
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

