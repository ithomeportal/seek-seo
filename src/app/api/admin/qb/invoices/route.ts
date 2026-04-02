import { NextResponse } from 'next/server'
import { qbQuery } from '@/lib/qb-db'

export async function GET() {
  try {
    const result = await qbQuery(
      `SELECT doc_number, customer_name, total_amt, balance, due_date, txn_date, status, email_status
       FROM qb_invoices
       ORDER BY txn_date DESC`
    )

    const invoices = result.rows.map((r: Record<string, unknown>) => ({
      docNumber: r.doc_number as string,
      customerName: r.customer_name as string,
      totalAmt: parseFloat(String(r.total_amt ?? '0')),
      balance: parseFloat(String(r.balance ?? '0')),
      dueDate: r.due_date as string | null,
      txnDate: r.txn_date as string | null,
      status: r.status as string,
      emailStatus: r.email_status as string | null,
    }))

    // Summary stats
    const totalInvoices = invoices.length
    const openInvoices = invoices.filter((i) => i.status === 'Open')
    const paidInvoices = invoices.filter((i) => i.status === 'Paid')
    const totalOutstanding = openInvoices.reduce((s, i) => s + i.balance, 0)
    const overdueInvoices = openInvoices.filter((i) => {
      if (!i.dueDate) return false
      return new Date(i.dueDate) < new Date()
    })
    const totalOverdue = overdueInvoices.reduce((s, i) => s + i.balance, 0)

    return NextResponse.json({
      success: true,
      data: {
        invoices,
        summary: {
          totalInvoices,
          openCount: openInvoices.length,
          paidCount: paidInvoices.length,
          totalOutstanding,
          overdueCount: overdueInvoices.length,
          totalOverdue,
        },
      },
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch QB invoices' },
      { status: 500 }
    )
  }
}
