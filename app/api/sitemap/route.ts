import { optimizely } from '@/lib/optimizely/fetch'
import { mapPathWithoutLocale } from '@/lib/optimizely/utils/language'

/**
 * GET handler that generates an XML sitemap for public CMS and Experience pages.
 *
 * - Fetches published URLs from Optimizely (`CMSPage`, `SEOExperience`).
 * - Normalizes each URL by stripping locale prefixes and ensuring a leading slash.
 * - Deduplicates and sorts the paths.
 * - Wraps them in a valid XML sitemap structure with the configured site domain.
 *
 * @returns {Promise<Response>} A Response containing `application/xml` sitemap content.
 *
 * @throws {Error} Returns a 500 XML error if `SITE_DOMAIN` is missing.
 *         Otherwise, always resolves with an XML response (even if CMS fetch fails).
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

/**
 * Ensures the provided path starts with a leading slash.
 *
 * @param path - The raw path (e.g. `"about"`).
 * @returns A normalized path (e.g. `"/about"`).
 */
function ensureLeadingSlash(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

/**
 * Removes a trailing slash from a URL if present.
 *
 * @param url - The full URL (e.g. `"https://example.com/"`).
 * @returns The URL without a trailing slash (e.g. `"https://example.com"`).
 */
function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

/**
 * Builds the XML string for a sitemap.
 *
 * @param paths - A list of normalized, unique paths (e.g. `["/about", "/contact"]`).
 * @param domain - The base site domain (without trailing slash).
 * @returns An XML string conforming to the sitemap protocol.
 */
function buildSitemapXml(paths: string[], domain: string): string {
  const urls = paths
    .map((p) => `  <url>\n    <loc>${domain}${p}</loc>\n  </url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}
