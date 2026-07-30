/**
 * Company email domains — the Microsoft 365 tenant's verified domains
 * (Graph `GET /domains`).
 *
 * ⚠ THIS APP LEGITIMATELY EMAILS OUTSIDERS. Unlike most of the estate, SEEK runs
 * a real customer-facing transaction flow, and four of its nine send sites are
 * *supposed* to reach people outside UNILINK:
 *
 *   1. `api/credit-application` — applicant acknowledgement with the signed PDF.
 *      A public, unauthenticated form; the signatory is a prospective customer.
 *   2. `api/portal/send-code`   — customer portal login code. Customers are
 *      external trucking companies; blocking this locks every one of them out.
 *   3. `lib/onboarding.ts`      — returning the customer their own signed
 *      ACH authorization / Lease & Guaranty PDF.
 *   4. `api/cron/onboarding-reminders` — chasing customers to finish onboarding.
 *
 * Those are the business. Do NOT put a company-domain filter in front of them.
 *
 * This list therefore guards the STAFF-facing sends only — the ones addressed to
 * rodney@ / emendoza@ today. Those are hardcoded constants, so the guard is
 * belt-and-braces against a future edit rather than a live hole; the point is
 * that a staff notification can never silently become an external one.
 *
 * It also backs the ADMIN login allowlist (`api/admin/send-code`), which is a
 * genuine gate: admin/CRM access is internal-only.
 */
export const ORG_EMAIL_DOMAINS: readonly string[] = [
  'hireinternational.com',
  'itunilink.com',
  'mencarllc.com',
  'mencarotr.com',
  'mspekt.com',
  'oiltex.com',
  'otxtransport.com',
  'otxtransportation.com',
  'prosperityenergyresources.com',
  'seekequipment.com',
  'u-capital.com',
  'unilinkcapital.com',
  'unilinkportal.com',
  'unilinktransportation.com',
  'unilinktransportationsa.mail.onmicrosoft.com',
  'unilinktransportationsa.onmicrosoft.com',
]

/** True when `value` is an address on a domain the organization owns. */
export function isOrgEmail(value: string | null | undefined): boolean {
  if (!value) return false
  const domain = value.split('@')[1]?.toLowerCase()
  return !!domain && ORG_EMAIL_DOMAINS.includes(domain)
}
