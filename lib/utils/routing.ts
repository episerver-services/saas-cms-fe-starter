import { getValidLocale } from '@/lib/optimizely/utils/language'

/**
 * Resolves and normalises the locale and slug parameters from dynamic routing.
 *
 * This ensures:
 * - Locale codes are always validated and normalised (future-proof for i18n).
 * - Slug arrays are safely joined into a leading-slash URL path.
 *
 * @param locale - The raw locale string from the route params (validated via `getValidLocale`).
 * @param slug - Optional array of path segments from [[...slug]] route.
 * @returns An object with `localeCode` (sanitised locale) and `formattedSlug` (URL path string).
 *
 * @example
 * resolveSlugAndLocale('en', ['products', 'blue-widget'])
 * // → { localeCode: 'en', formattedSlug: '/products/blue-widget' }
 *
 * resolveSlugAndLocale('default', undefined)
 * // → { localeCode: 'default', formattedSlug: '/' }
 */
export function resolveSlugAndLocale(locale: string, slug?: string[]) {
  return {
    localeCode: getValidLocale(locale),
    formattedSlug: '/' + (slug?.join('/') ?? ''),
  }
}
