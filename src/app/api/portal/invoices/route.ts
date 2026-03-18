import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')

  if (!clientId || isNaN(Number(clientId))) {
    return NextResponse.json(
      { success: false, error: 'Valid clientId is required' },
      { status: 400 }
    )
  }

  try {
    const result = await query(
      'SELECT * FROM invoices WHERE client_id = $1 ORDER BY due_date DESC',
      [Number(clientId)]
    )

    const invoices = result.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      invoiceNumber: row.invoice_number,
      dueDate: row.due_date,
      paidDate: row.paid_date,
      amount: Number(row.amount),
      status: row.status,
    }))

    return NextResponse.json({ success: true, data: invoices })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
