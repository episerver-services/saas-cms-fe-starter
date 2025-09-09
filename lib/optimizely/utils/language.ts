// ─────────────────────────────────────────────
//  Locale Helpers (fallback for GraphQL SDK enum)
// ─────────────────────────────────────────────

/**
 * Local fallback for the `Locales` enum that normally comes from the GraphQL SDK.
 *
 * Extend this map as needed to add support for more languages.
 */
export const Locales = {
  En: 'en',
  // Example: Fr: 'fr', De: 'de', etc.
} as const

/**
 * Union type of all supported locale string values.
 * Example: `'en' | 'fr' | 'de'`
 */
export type Locales = (typeof Locales)[keyof typeof Locales]

/**
 * The default locale used when validation fails or
 * when a provided locale is unsupported.
 */
export const DEFAULT_LOCALE: Locales = Locales.En

/**
 * Master list of supported locales for the site.
 * Keep this array in sync with the `Locales` map above.
 */
export const LOCALES: Locales[] = [Locales.En]

/**
 * Validates a locale string against supported locales.
 * Returns a safe `Locales` value, falling back to the default if invalid.
 *
 * @param locale - A candidate locale string (e.g. `'en'`, `'fr'`).
 * @returns A valid `Locales` value.
 *
 * @example
 * getValidLocale('en') // 'en'
 * getValidLocale('fr') // 'en' (default, since 'fr' not in LOCALES)
 */
export function getValidLocale(locale: string): Locales {
  return LOCALES.includes(locale as Locales)
    ? (locale as Locales)
    : DEFAULT_LOCALE
}

/**
 * Returns the full list of supported locales.
 *
 * @returns An array of `Locales` values.
 */
export function getLocales(): Locales[] {
  return LOCALES
}

/**
 * Removes a locale prefix from a given path string if present.
 *
 * @param path - A URL path that may include a locale segment.
 * @returns The path without a leading locale code.
 *
 * @example
 * mapPathWithoutLocale('/en/about') // 'about'
 * mapPathWithoutLocale('/about')    // 'about'
 */
export function mapPathWithoutLocale(path: string): string {
  const parts = path.split('/').filter(Boolean)

  if (LOCALES.includes(parts[0] as Locales)) {
    parts.shift()
  }

  return parts.join('/')
}
