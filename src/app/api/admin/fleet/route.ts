import { NextResponse } from 'next/server'
import { getFleetUnits } from '@/data/demo-data'

export async function GET() {
  const units = getFleetUnits()
  return NextResponse.json({ success: true, data: units })
}
