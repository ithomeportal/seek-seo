import { NextResponse } from 'next/server'
import { getClientInvoices } from '@/data/demo-data'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')

  if (!clientId || isNaN(Number(clientId))) {
    return NextResponse.json(
      { success: false, error: 'Valid clientId is required' },
      { status: 400 }
    )
  }

  const clientInvoices = getClientInvoices(Number(clientId))
  return NextResponse.json({ success: true, data: clientInvoices })
}
