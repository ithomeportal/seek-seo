import type { Metadata } from 'next'

/**
 * Exists only to carry `noindex` for the whole `/admin` subtree.
 *
 * `admin/page.tsx` renders a client component and `admin/dashboard/page.tsx` is
 * itself `'use client'`, so neither can export `metadata` — a layout is the only
 * place the tag can come from. Without it these routes had no robots directive
 * at all while being linked from `PORTAL_LINKS` in the header of every public
 * page, and next-sitemap was submitting `/admin` and `/admin/dashboard` to
 * Google on every build.
 *
 * ⚠ This tag only works if the page stays CRAWLABLE. A `Disallow` in robots.txt
 * stops Googlebot fetching the page, so it never sees the noindex and the URL
 * can still be listed (URL-only) off those internal links. Keep `/admin` out of
 * the robots disallow list — see `next-sitemap.config.js`.
 *
 * Matches the existing treatment of `/crm` and `/(private)/rentalapp`.
 */
export const metadata: Metadata = {
  title: 'Management',
  robots: { index: false, follow: false },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
