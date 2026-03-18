import { NextResponse } from 'next/server'
import { getCustomerConcentration } from '@/data/demo-data'

export async function GET() {
  const concentration = getCustomerConcentration()
  return NextResponse.json({ success: true, data: concentration })
}
