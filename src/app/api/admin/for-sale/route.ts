import { NextResponse } from 'next/server'
import { getEquipmentForSale } from '@/data/demo-data'

export async function GET() {
  const equipment = getEquipmentForSale()
  return NextResponse.json({ success: true, data: equipment })
}
