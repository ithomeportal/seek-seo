import { NextResponse } from 'next/server'
import { getClientDashboardStats } from '@/data/demo-data'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')

  if (!clientId || isNaN(Number(clientId))) {
    return NextResponse.json(
      { success: false, error: 'Valid clientId is required' },
      { status: 400 }
    )
  }

  const stats = getClientDashboardStats(Number(clientId))
  return NextResponse.json({ success: true, data: stats })
}
