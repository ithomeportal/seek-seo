import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const activityId = Number(id)
  if (!Number.isInteger(activityId) || activityId <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 })
  }

  try {
    const result = await query(
      `UPDATE crm_activities SET status = 'Completed', completed_at = NOW() WHERE id = $1`,
      [activityId]
    )
    if ((result.rowCount ?? 0) === 0) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('CRM activity complete error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ success: false, error: 'Failed to complete activity' }, { status: 500 })
  }
}
