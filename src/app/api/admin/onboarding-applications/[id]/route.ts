import { NextResponse } from 'next/server'
import { bundleProgress, getApplicationById } from '@/lib/onboarding'

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const numericId = Number(id)
  if (!Number.isFinite(numericId)) {
    return NextResponse.json(
      { success: false, message: 'Invalid id' },
      { status: 400 }
    )
  }
  const app = await getApplicationById(numericId)
  if (!app) {
    return NextResponse.json(
      { success: false, message: 'Application not found' },
      { status: 404 }
    )
  }
  return NextResponse.json({
    success: true,
    data: { ...app, progress: bundleProgress(app) },
  })
}
