import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { readPortalSession } from '@/lib/portal-auth'

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

  return NextResponse.json({
    success: true,
    email: session.email,
    customer,
    hasExistingAccount: customer !== null,
  })
}
