/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://seekequipment.com',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/api/', '/admin/'] },
    ],
    additionalSitemaps: [],
  },
  exclude: ['/rentalagree', '/rentalapp', '/ach', '/apple-icon.png', '/icon.svg'],
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
