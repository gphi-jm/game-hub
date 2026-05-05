const { mkdirSync, writeFileSync } = require('node:fs')
const { resolve } = require('node:path')

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
const distDir = resolve(__dirname, '..', 'dist')
const sitemapPath = resolve(distDir, 'sitemap.xml')
const generatedAt = new Date().toISOString()

const urls = [
  {
    loc: siteUrl,
    lastmod: generatedAt,
    changefreq: 'daily',
    priority: '1.0',
  },
]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`

mkdirSync(distDir, { recursive: true })
writeFileSync(sitemapPath, sitemap)

console.log(`Generated sitemap at ${sitemapPath}`)
