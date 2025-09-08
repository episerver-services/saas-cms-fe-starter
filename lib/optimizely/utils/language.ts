// 🔁 Local fallback for `Locales` enum (matches expected values)
export const Locales = {
  En: 'en',
  // Extend here if needed: Fr: 'fr', De: 'de', etc.
} as const

export type Locales = (typeof Locales)[keyof typeof Locales]

/**
 * The default locale to fall back to when an invalid locale is encountered.
 */
export const DEFAULT_LOCALE: Locales = Locales.En

/**
 * List of supported locales for the site.
 * Extend this array as needed to support additional languages.
 */
export const LOCALES: Locales[] = [Locales.En]

/**
 * Validates a provided locale string against the list of supported locales.
 * Returns a valid `Locales` enum value or falls back to the default locale.
 *
 * @param locale - The locale string to validate (e.g., 'en', 'fr', 'de').
 * @returns A safe `Locales` value that exists in the supported set.
 */
export function getValidLocale(locale: string): Locales {
  return LOCALES.includes(locale as Locales)
    ? (locale as Locales)
    : DEFAULT_LOCALE
}

/**
 * Returns all supported locales.
 *
 * @returns An array of `Locales` enum values.
 */
export function getLocales(): Locales[] {
  return LOCALES
}

/**
 * Removes a locale prefix from a given path string if it exists.
 * For example: `/en/about` → `about`
 *
 * @param path - A URL pathname that may include a locale segment.
 * @returns The path string without the locale prefix.
 */
export function mapPathWithoutLocale(path: string): string {
  const parts = path.split('/').filter(Boolean)

  if (LOCALES.includes(parts[0] as Locales)) {
    parts.shift()
  }

  return parts.join('/')
}
