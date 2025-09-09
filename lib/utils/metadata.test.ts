import { normalizePath, generateAlternates } from './metadata'
import { LOCALES } from '@/lib/optimizely/utils/language'

describe('normalizePath', () => {
  it('returns empty string for root "/"', () => {
    expect(normalizePath('/')).toBe('')
  })

  it('lowercases the path', () => {
    expect(normalizePath('/About/Us')).toBe('about/us')
  })

  it('removes leading slash', () => {
    expect(normalizePath('/contact')).toBe('contact')
  })

  it('removes trailing slash', () => {
    expect(normalizePath('about/')).toBe('about')
  })

  it('removes both leading and trailing slashes', () => {
    expect(normalizePath('/services/')).toBe('services')
  })

  it('leaves clean path unchanged', () => {
    expect(normalizePath('products')).toBe('products')
  })
})

describe('generateAlternates', () => {
  it('returns canonical and languages for all locales', () => {
    const result = generateAlternates('en', '/About/')

    expect(result).toHaveProperty('canonical', '/en/about')
    expect(result).toHaveProperty('languages')

    // ensure all locales are included
    LOCALES.forEach((l) => {
      expect(result.languages![l]).toBe(`/${l}/about`)
    })
  })

  it('handles root path correctly', () => {
    const result = generateAlternates('en', '/')

    expect(result.canonical).toBe('/en/')
    LOCALES.forEach((l) => {
      expect(result.languages![l]).toBe(`/${l}/`)
    })
  })
})
