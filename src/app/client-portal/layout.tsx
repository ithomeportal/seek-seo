import type { Metadata } from 'next'

/**
 * Carries `noindex` for the customer portal.
 *
 * `client-portal/page.tsx` is `'use client'`, so it cannot export `metadata`
 * itself. This route had no robots directive at all and was being submitted to
 * Google by next-sitemap on every build, while also being linked from
 * `PORTAL_LINKS` in the header of every public page.
 *
 * ⚠ Only effective while the route stays CRAWLABLE — a robots.txt `Disallow`
 * would stop Googlebot seeing this tag. See `next-sitemap.config.js`.
 */
export const metadata: Metadata = {
  title: 'Customer Portal',
  robots: { index: false, follow: false },
}

export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
