export const dynamic = 'force-dynamic'

/**
 * Stubbed sitemap.xml response.
 * Replace with CMS-powered sitemap once integration is active.
 */
export async function GET() {
  const domain = process.env.SITE_DOMAIN ?? 'http://localhost:3000'

  const staticPages = [
    '/', // homepage
    '/about',
    '/contact',
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
  .map((path) => `  <url><loc>${domain}${path}</loc></url>`)
  .join('\n')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}