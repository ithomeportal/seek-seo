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

  /** Soft archive — hides a row from the admin lists without destroying it. */
  archived_at: string | null
  archived_by: string | null
  archive_reason: string | null
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

  archivedAt: string | null
  archivedBy: string | null
  archiveReason: string | null
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
    archivedAt: row.archived_at ?? null,
    archivedBy: row.archived_by ?? null,
    archiveReason: row.archive_reason ?? null,
  }
}

/**
 * The applicant's own live application.
 *
 * Archived rows are invisible here on purpose: archiving a row is how an admin
 * says "this was a test / a mistake", and the address must then behave like a
 * brand-new applicant rather than resuming the discarded attempt. Everything on
 * the customer side (portal resume, completion check, reminder emails) flows
 * through this function, so the exclusion only has to be right once.
 */
export async function getApplicationByEmail(
  email: string
): Promise<OnboardingApplication | null> {
  const result = await query<OnboardingApplicationRow>(
    `SELECT * FROM customer_onboarding_applications
      WHERE LOWER(email) = LOWER($1)
        AND archived_at IS NULL
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

/**
 * Loose key for deciding whether a company already exists in `customers`.
 *
 * ⚠ Shared deliberately: `/api/admin/customers` matches onboarding records to
 * customers with this, `linkCustomerForApplication` creates them with it, and
 * scripts/link-onboarding-customers.mjs backfilled them with a copy. If the
 * three ever disagree about what counts as the same company, the admin UI shows
 * a company twice and the portal creates a duplicate customer.
 */
export function companyNameKey(value: string | null): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/[.,'‘’]/g, '')
    .replace(/\b(llc|inc|l\.l\.c|corp|corporation|co|ltd)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Make sure the company behind an onboarding application has a row in
 * `customers`, and record the link on the application.
 *
 * Before 2026-09-03 the two tables were disjoint — a company that signed up
 * through the portal existed only as an onboarding record, and somebody had to
 * hand-enter it as a customer before it appeared under Customers at all. Called
 * from the profile step, this keeps "everything in Onboarding is in Customers"
 * true by construction instead of by a periodic backfill.
 *
 * Idempotent: an application that already carries `customer_id` is left alone,
 * and an existing customer is linked rather than duplicated (`customers` has no
 * unique index on email, so the guard has to live here).
 *
 * ⚠ Widths are clamped in SQL. The onboarding contact-name columns are
 * varchar(120) and the customer ones are varchar(100): assigning across that
 * pair raises SQLSTATE 22001 the first day a long name arrives, and it would
 * surface as the customer's profile step failing for no visible reason.
 */
export async function linkCustomerForApplication(
  app: OnboardingApplication
): Promise<number | null> {
  if (app.customerId !== null) return app.customerId

  const email = app.email.trim().toLowerCase()
  const key = companyNameKey(app.companyName)

  // Matched in JS against the whole (small) customer list rather than in SQL:
  // the normalised key would otherwise have to be interpolated into a regex,
  // and a company name containing `(` would both break the query and hand a
  // caller-supplied pattern to the planner.
  const candidates = await query<{
    id: number
    email: string | null
    company_name: string
    alias: string | null
  }>(`SELECT id, email, company_name, alias FROM customers ORDER BY id ASC`)

  // Email first, then the normalised name — the same precedence
  // /api/admin/customers uses, so the two agree on who is already a customer.
  let customerId: number | null =
    candidates.rows.find((c) => (c.email ?? '').trim().toLowerCase() === email)?.id ??
    (key === ''
      ? null
      : (candidates.rows.find(
          (c) => companyNameKey(c.company_name) === key || companyNameKey(c.alias) === key
        )?.id ?? null))

  if (customerId === null) {
    const created = await query<{ id: number }>(
      `INSERT INTO customers (
         company_name, contact_first_name, contact_last_name, phone, email,
         ach_authorized, status, created_at, updated_at
       ) VALUES (
         LEFT($1, 255), LEFT($2, 100), LEFT($3, 100), LEFT($4, 50), LEFT($5, 255),
         false, 'active', NOW(), NOW()
       ) RETURNING id`,
      [
        app.companyName ?? app.email,
        app.contactFirstName,
        app.contactLastName,
        app.phone,
        app.email,
      ]
    )
    customerId = created.rows[0].id
  }

  await query(
    `UPDATE customer_onboarding_applications
        SET customer_id = $1, updated_at = NOW()
      WHERE id = $2 AND customer_id IS NULL`,
    [customerId, app.id]
  )

  return customerId
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

