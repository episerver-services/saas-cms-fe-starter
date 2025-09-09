import { getOptimizedImageUrl } from './cdn-image'

describe('getOptimizedImageUrl', () => {
  it('rewrites relative paths with default width/quality', () => {
    const result = getOptimizedImageUrl('/globalassets/test.jpg')
    expect(result).toBe(
      '/cdn-cgi/image/width=800,quality=75/globalassets/test.jpg'
    )
  })

  it('applies custom width and quality', () => {
    const result = getOptimizedImageUrl('/globalassets/test.jpg', {
      width: 400,
      quality: 50,
    })
    expect(result).toBe(
      '/cdn-cgi/image/width=400,quality=50/globalassets/test.jpg'
    )
  })

  it('returns absolute URLs unchanged', () => {
    const url = 'https://example.com/image.jpg'
    expect(getOptimizedImageUrl(url)).toBe(url)
  })

  it('returns non-http relative paths untouched if not starting with "/"', () => {
    const url = 'data:image/png;base64,abcdef'
    expect(getOptimizedImageUrl(url)).toBe(url)
  })

  it('falls back to defaults when opts are empty', () => {
    const result = getOptimizedImageUrl('/globalassets/test.jpg', {})
    expect(result).toBe(
      '/cdn-cgi/image/width=800,quality=75/globalassets/test.jpg'
    )
  })
})
