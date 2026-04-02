import { NextResponse } from 'next/server'
import { qbQuery } from '@/lib/qb-db'

export async function GET() {
  try {
    const result = await qbQuery(
      `SELECT display_name, company_name, email, phone, balance, active
       FROM qb_customers
       WHERE active = true
       ORDER BY display_name ASC`
    )

    const customers = result.rows.map((r: Record<string, unknown>) => ({
      displayName: r.display_name as string,
      companyName: r.company_name as string | null,
      email: r.email as string | null,
      phone: r.phone as string | null,
      balance: parseFloat(String(r.balance ?? '0')),
      active: r.active as boolean,
    }))

    return NextResponse.json({ success: true, data: customers })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch QB customers' },
      { status: 500 }
    )
  }
}
