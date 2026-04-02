import { NextResponse } from 'next/server'
import { qbQuery } from '@/lib/qb-db'

export async function GET() {
  try {
    const result = await qbQuery(
      `SELECT sync_type, status, records_fetched, started_at, completed_at
       FROM qb_sync_logs
       WHERE sync_type IN ('customers', 'invoices', 'payments')
       ORDER BY started_at DESC
       LIMIT 3`
    )

    const syncs: Record<string, { status: string; recordsFetched: number; syncedAt: string }> = {}
    for (const row of result.rows) {
      const t = row.sync_type as string
      if (!syncs[t]) {
        syncs[t] = {
          status: row.status as string,
          recordsFetched: Number(row.records_fetched),
          syncedAt: (row.completed_at ?? row.started_at) as string,
        }
      }
    }

    return NextResponse.json({ success: true, data: syncs })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sync status' },
      { status: 500 }
    )
  }
}
