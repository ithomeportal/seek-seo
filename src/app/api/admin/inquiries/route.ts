import { NextResponse } from 'next/server'
import { getContactSubmissions } from '@/data/demo-data'

export async function GET() {
  const submissions = getContactSubmissions()
  return NextResponse.json({ success: true, data: submissions })
}
