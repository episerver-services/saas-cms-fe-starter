import { optimizely } from '@/lib/optimizely/fetch'
import { mapPathWithoutLocale } from '@/lib/optimizely/utils/language'

/**
 * Generates an XML sitemap for public CMS and Experience pages.
 *
 * This route returns a valid `sitemap.xml` response using the `AllPages` query
 * to fetch published content URLs from Optimizely CMS.
 *
 * It filters only relevant page types (`CMSPage` and `SEOExperience`),
 * strips locale prefixes, and outputs well-formed XML for search engines.
 *
 * @returns A `Response` object with XML body and appropriate `Content-Type`.
 *
 * @example XML Output
 * ```xml
 * <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
 *   <url>
 *     <loc>https://yourdomain.com/about</loc>
 *   </url>
 * </urlset>
 * ```
 */
export async function GET() {
  const pageTypes = ['CMSPage', 'SEOExperience']
  let paths: string[] = []

  try {
    const data = await optimizely.AllPages({ pageType: pageTypes })
    const items = data._Content?.items || []

    paths = items
      .map((item) => {
        const metadata = item?._metadata

        if (
          metadata &&
          typeof metadata === 'object' &&
          'url' in metadata &&
          typeof metadata.url?.default === 'string'
        ) {
          return mapPathWithoutLocale(metadata.url.default)
        }

        return null
      })
      .filter((path): path is string => path !== null)
      .map(mapPathWithoutLocale)
  } catch (e) {
    console.error('Sitemap fetch error:', e)
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths
  .map(
    (path) => `
  <url>
    <loc>${process.env.SITE_DOMAIN}${path}</loc>
  </url>`
  )
  .join('\n')}
</urlset>`

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}
