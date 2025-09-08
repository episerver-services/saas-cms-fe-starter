import { getValidLocale } from '@/lib/optimizely/utils/language'

/**
 * Resolves and normalises the locale and slug parameters from dynamic routing.
 *
 * This utility ensures consistent formatting for content queries and metadata.
 * It is designed to work in projects where locale-based routing may be added later.
 *
 * @param locale - The raw locale string from the route params (may be unused for now)
 * @param slug - Optional array of path segments from [[...slug]] route
 * @returns An object with `localeCode` (sanitised locale) and `formattedSlug` (URL path string)
 *
 * @example
 * // With locale support later
 * resolveSlugAndLocale('en', ['products', 'blue-widget'])
 * → { localeCode: 'en', formattedSlug: '/products/blue-widget' }
 *
 * // Without locale (for now)
 * resolveSlugAndLocale('default', undefined)
 * → { localeCode: 'default', formattedSlug: '/' }
 */
export function resolveSlugAndLocale(locale: string, slug?: string[]) {
  return {
    localeCode: getValidLocale(locale),
    formattedSlug: '/' + (slug?.join('/') ?? ''),
  }
}
