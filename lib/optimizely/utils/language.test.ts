import {
  Locales,
  DEFAULT_LOCALE,
  LOCALES,
  getValidLocale,
  getLocales,
  mapPathWithoutLocale,
} from './language'

describe('Locales utilities', () => {
  describe('getValidLocale', () => {
    it('returns a supported locale when valid', () => {
      expect(getValidLocale('en')).toBe(Locales.En)
    })

    it('falls back to DEFAULT_LOCALE when unsupported', () => {
      expect(getValidLocale('fr')).toBe(DEFAULT_LOCALE)
      expect(getValidLocale('')).toBe(DEFAULT_LOCALE)
      expect(getValidLocale('123')).toBe(DEFAULT_LOCALE)
    })
  })

  describe('getLocales', () => {
    it('returns the supported locales array', () => {
      expect(getLocales()).toEqual(LOCALES)
      expect(getLocales()).toContain(Locales.En)
    })
  })

  describe('mapPathWithoutLocale', () => {
    it('removes a valid locale prefix', () => {
      expect(mapPathWithoutLocale('/en/about')).toBe('about')
      expect(mapPathWithoutLocale('/en/')).toBe('')
    })

    it('leaves path unchanged if prefix is not a supported locale', () => {
      expect(mapPathWithoutLocale('/fr/about')).toBe('fr/about')
      expect(mapPathWithoutLocale('/de/contact')).toBe('de/contact')
    })

    it('handles root path and empty string', () => {
      expect(mapPathWithoutLocale('/')).toBe('')
      expect(mapPathWithoutLocale('')).toBe('')
    })

    it('handles paths without leading slash', () => {
      expect(mapPathWithoutLocale('en/about')).toBe('about')
      expect(mapPathWithoutLocale('about')).toBe('about')
    })

    it('preserves deeper paths after stripping locale', () => {
      expect(mapPathWithoutLocale('/en/blog/post-1')).toBe('blog/post-1')
    })
  })
})
