import { LOCALES } from '@/lib/optimizely/utils/language'
import { AlternateURLs } from 'next/dist/lib/metadata/types/alternative-urls-types'

/**
 * Normalizes a given path string by:
 * - Lowercasing it
 * - Removing a leading `/` if present
 * - Removing a trailing `/` if present
 * - Converting `/` to an empty string (root)
 *
 * @param {string} path - The URL path to normalize
 * @returns {string} The normalized path
 */
export function normalizePath(path: string): string {
  path = path.toLowerCase()

  if (path === '/') {
    return ''
  }

  if (path.endsWith('/')) {
    path = path.substring(0, path.length - 1)
  }

  if (path.startsWith('/')) {
    path = path.substring(1)
  }

  return path
}

/**
 * Generates a set of alternate URLs (hreflang and canonical) for all supported locales.
 *
 * @param {string} locale - The current active locale (e.g. 'en')
 * @param {string} path - The raw path to localize (e.g. '/about/')
 * @returns {AlternateURLs} An object with `canonical` and `languages` keys for use in Next.js metadata
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
