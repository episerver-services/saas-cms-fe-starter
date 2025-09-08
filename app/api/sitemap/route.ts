// app/sitemap/route.ts (or wherever your route lives)
import { optimizely } from '@/lib/optimizely/fetch'
import { mapPathWithoutLocale } from '@/lib/optimizely/utils/language'

/**
 * Generates an XML sitemap for public CMS and Experience pages.
 *
 * Fetches published URLs from Optimizely, strips locale prefixes,
 * deduplicates/sorts paths, and returns a valid sitemap XML.
 */
export async function GET() {
  const siteDomain = process.env.SITE_DOMAIN || ''
  if (!siteDomain) {
    // Config error — fail loudly so it’s obvious in CI
    const xml = `<?xml version="1.0" encoding="UTF-8"?><error>Missing SITE_DOMAIN</error>`
    return new Response(xml, {
      status: 500,
      headers: { 'Content-Type': 'application/xml' },
    })
  }

  const pageTypes = ['CMSPage', 'SEOExperience'] as const
  let paths: string[] = []

  try {
    const data = await optimizely.AllPages({ pageType: pageTypes as any })
    const items = data._Content?.items ?? []

    paths = items
      .map((item: any) => item?._metadata?.url?.default as unknown)
      .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
      .map((p) => ensureLeadingSlash(mapPathWithoutLocale(p)))
  } catch {
    // If the CMS is down, still return a valid (empty) sitemap.
    paths = []
  }

  const uniqueSorted = Array.from(new Set(paths)).sort()
  const xml = buildSitemapXml(uniqueSorted, stripTrailingSlash(siteDomain))

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  })
}

function ensureLeadingSlash(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

function buildSitemapXml(paths: string[], domain: string): string {
  const urls = paths
    .map((p) => `  <url>\n    <loc>${domain}${p}</loc>\n  </url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}
