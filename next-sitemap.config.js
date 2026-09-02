/** @type {import('next-sitemap').IConfig} */

/**
 * Private routes: excluded from the sitemap AND carrying `robots: noindex` in
 * their own layout/page metadata.
 *
 * ⚠ Both halves are required, and the second one is the reason these are NOT in
 * the robots.txt disallow list below.
 *
 * Every one of these is linked from `PORTAL_LINKS` in the header of EVERY public
 * page, so Google will always discover them. A robots.txt `Disallow` stops
 * Googlebot fetching the page, which means it never sees the `noindex` — and a
 * blocked-but-linked URL stays eligible to appear in results as a URL-only
 * entry. To actually keep a linked page out of the index it must be crawlable
 * and answer with `noindex`.
 *
 * Before 2026-09-02 `/admin`, `/admin/dashboard` and `/client-portal` were in
 * neither list: no noindex tag, and next-sitemap was submitting all three to
 * Google on every build.
 *
 * Adding a new private route? Add its glob here AND give it
 * `robots: { index: false, follow: false }` — a layout when the page is
 * `'use client'` and cannot export metadata itself.
 */
const PRIVATE_ROUTES = [
  '/admin',
  '/admin/*',
  '/client-portal',
  '/client-portal/*',
  '/crm',
  '/crm/*',
  '/rentalagree',
  '/rentalapp',
  '/ach',
]

module.exports = {
  siteUrl: 'https://seekequipment.com',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    // One merged group. Two separate `User-agent: *` blocks is legal and Google
    // merges them, but not every crawler does — some honour only the first
    // matching group, which made the `Disallow` lines advisory at best.
    policies: [
      {
        userAgent: '*',
        allow: '/',
        // API routes only. The private PAGES are deliberately crawlable so
        // their noindex tag is seen; see the note above.
        disallow: ['/api/'],
      },
    ],
    additionalSitemaps: [],
  },
  exclude: [...PRIVATE_ROUTES, '/apple-icon.png', '/icon.svg'],
  changefreq: 'weekly',
  priority: 0.7,
  transform: async (config, path) => {
    let priority = 0.7
    let changefreq = 'weekly'
    if (path === '/') {
      priority = 1.0
      changefreq = 'daily'
    } else if (path.startsWith('/equipment')) {
      priority = 0.9
    } else if (path === '/contact' || path === '/quote' || path === '/credit-application') {
      priority = 0.8
    } else if (path === '/for-sale') {
      priority = 0.7
    }
    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    }
  },
}
