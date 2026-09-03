import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { readPortalSession } from '@/lib/portal-auth'
import { getApplicationByEmail, sectionProgress } from '@/lib/onboarding'

export async function GET() {
  const session = await readPortalSession()
  if (!session) {
    return NextResponse.json(
      { success: false, message: 'Not signed in' },
      { status: 401 }
    )
  }

  let customer: {
    id: number
    companyName: string | null
    contactFirstName: string | null
    contactLastName: string | null
    email: string
    phone: string | null
  } | null = null

  if (session.customerId !== null) {
    const result = await query<{
      id: number
      company_name: string | null
      contact_first_name: string | null
      contact_last_name: string | null
      email: string
      phone: string | null
    }>(
      `SELECT id, company_name, contact_first_name, contact_last_name, email, phone
         FROM customers WHERE id = $1`,
      [session.customerId]
    )
    if (result.rows.length > 0) {
      const r = result.rows[0]
      customer = {
        id: r.id,
        companyName: r.company_name,
        contactFirstName: r.contact_first_name,
        contactLastName: r.contact_last_name,
        email: r.email,
        phone: r.phone,
      }
    }
  }

  // ⚠ Whether the portal shows the onboarding wizard or the rentals dashboard
  // is decided HERE, not by `hasExistingAccount`.
  //
  // Until 2026-09-03 the page branched on "does a customers row exist for this
  // email", which was a safe proxy only while the two tables were disjoint.
  // Once every onboarding company got a customer row, that proxy would have
  // dropped three companies still working through their checklist into an empty
  // rentals dashboard with no way to upload the documents they still owe.
  // The truthful signal is the checklist itself.
  const application = await getApplicationByEmail(session.email)
  const onboardingIncomplete =
    application !== null && !sectionProgress(application).isComplete

  return NextResponse.json({
    success: true,
    email: session.email,
    customer,
    hasExistingAccount: customer !== null,
    onboardingIncomplete,
  })
}
