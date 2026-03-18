import { NextResponse } from 'next/server'
import { getFleetStats } from '@/data/demo-data'

export async function GET() {
  const stats = getFleetStats()
  return NextResponse.json({ success: true, data: stats })
}
