import { resolveSlugAndLocale } from './routing'

describe('resolveSlugAndLocale', () => {
  it('returns valid locale and root path when slug is undefined', () => {
    expect(resolveSlugAndLocale('en')).toEqual({
      localeCode: 'en',
      formattedSlug: '/',
    })
  })

  it('joins slug segments with slashes', () => {
    expect(resolveSlugAndLocale('en', ['products', 'blue-widget'])).toEqual({
      localeCode: 'en',
      formattedSlug: '/products/blue-widget',
    })
  })

  it('falls back to default locale when unsupported', () => {
    expect(resolveSlugAndLocale('fr')).toEqual({
      localeCode: 'en', // default from getValidLocale
      formattedSlug: '/',
    })
  })

  it('handles empty slug array as root', () => {
    expect(resolveSlugAndLocale('en', [])).toEqual({
      localeCode: 'en',
      formattedSlug: '/',
    })
  })
})
