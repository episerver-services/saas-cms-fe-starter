import { LOCALES } from '@/lib/optimizely/utils/language'
import { AlternateURLs } from 'next/dist/lib/metadata/types/alternative-urls-types'

/**
 * Normalizes a path string for consistent use in routing and metadata.
 *
 * Transformations:
 * - Lowercases the string
 * - Removes leading `/`
 * - Removes trailing `/`
 * - Converts root (`/`) to an empty string
 *
 * Ensures paths like `/About/` and `/about/` normalize to `about`.
 *
 * @param {string} path - The raw URL path to normalize
 * @returns {string} The normalized path (empty string for root)
 *
 * @example
 * normalizePath('/About/') // ➜ "about"
 * normalizePath('/')       // ➜ ""
 */
export function normalizePath(path: string): string {
  path = path.toLowerCase()

  if (path === '/') return ''

  if (path.endsWith('/')) {
    path = path.substring(0, path.length - 1)
  }

  if (path.startsWith('/')) {
    path = path.substring(1)
  }

  return path
}

/**
 * Generates localized alternate URLs (hreflang metadata) for all supported locales.
 *
 * Produces:
 * - `canonical`: the canonical URL for the current locale
 * - `languages`: a mapping of locale → localized URL for <link rel="alternate" hreflang="...">
 *
 * Used in Next.js metadata functions to help search engines understand
 * localized versions of a page.
 *
 * ⚠️ Note:
 * - By default, this returns **relative paths** (e.g. `/en/about`).
 * - For multi-domain SEO setups (e.g. `example.com` for EN and `example.fr` for FR),
 *   you should prepend the correct domain to each URL before returning them.
 *
 * @param {string} locale - The current active locale (e.g. "en")
 * @param {string} path - The raw path to localize (e.g. "/about/")
 * @returns {AlternateURLs} Object containing canonical and language mappings
 *
 * @example
 * generateAlternates("en", "/About/")
 * // ➜ {
 * //   canonical: "/en/about",
 * //   languages: { en: "/en/about" }
 * // }
 */
export function generateAlternates(
  locale: string,
  path: string
): AlternateURLs {
  path = normalizePath(path)

  return {
    canonical: `/${locale}/${path}`,
    languages: Object.assign(
      {},
      ...LOCALES.map((l) => ({ [l]: `/${l}/${path}` }))
    ),
  }
}
