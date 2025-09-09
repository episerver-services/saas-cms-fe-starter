import { createUrl, withLeadingSlash, cn } from './utils'

describe('utils/misc', () => {
  describe('createUrl', () => {
    it('builds a URL without query string when params are empty', () => {
      const params = new URLSearchParams()
      expect(createUrl('/search', params)).toBe('/search')
    })

    it('builds a URL with query string when params are present', () => {
      const params = new URLSearchParams({ q: 'foo', page: '1' })
      const url = createUrl('/search', params)
      // Order may vary depending on browser, so use contains
      expect(url).toContain('/search?')
      expect(url).toContain('q=foo')
      expect(url).toContain('page=1')
    })
  })

  describe('withLeadingSlash', () => {
    it('returns path unchanged if it already starts with "/"', () => {
      expect(withLeadingSlash('/about')).toBe('/about')
    })

    it('prepends "/" if missing', () => {
      expect(withLeadingSlash('about')).toBe('/about')
    })

    it('handles empty string', () => {
      expect(withLeadingSlash('')).toBe('/')
    })
  })

  describe('cn', () => {
    it('merges class strings', () => {
      expect(cn('p-4', 'm-2')).toBe('p-4 m-2')
    })

    it('deduplicates conflicting Tailwind classes (last wins)', () => {
      expect(cn('text-sm', 'text-lg')).toBe('text-lg')
    })

    it('supports conditional classes via clsx', () => {
      expect(cn('base', false && 'hidden', true && 'visible')).toBe(
        'base visible'
      )
    })

    it('handles arrays and undefined gracefully', () => {
      expect(cn(['flex', undefined, 'items-center'])).toBe('flex items-center')
    })
  })
})
