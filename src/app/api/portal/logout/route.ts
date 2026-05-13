import { NextResponse } from 'next/server'
import { PORTAL_SESSION_COOKIE, deletePortalSession } from '@/lib/portal-auth'

export async function POST() {
  await deletePortalSession()
  const response = NextResponse.json({ success: true })
  response.cookies.set(PORTAL_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return response
}
