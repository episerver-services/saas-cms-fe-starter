import cloudinaryLoader, {
  extractCloudinaryPublicID,
} from './cloudinary-loader'

describe('Cloudinary utilities', () => {
  describe('extractCloudinaryPublicID', () => {
    it('returns public ID with extension', () => {
      const url =
        'https://res.cloudinary.com/demo/image/upload/v12345/sample.jpg'
      expect(extractCloudinaryPublicID(url)).toBe('sample.jpg')
    })

    it('returns public ID without extension if missing', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/v12345/sample'
      expect(extractCloudinaryPublicID(url)).toBe('sample')
    })

    it('returns empty string on invalid URL', () => {
      expect(extractCloudinaryPublicID('')).toBe('')
      expect(extractCloudinaryPublicID('not-a-url')).toBe('')
    })
  })

  describe('cloudinaryLoader', () => {
    it('rewrites a Cloudinary image URL with default params', () => {
      const url =
        'https://res.cloudinary.com/demo/image/upload/v12345/sample.jpg'
      const result = cloudinaryLoader({ src: url, width: 600 })
      expect(result).toBe(
        'https://res.cloudinary.com/demo/image/upload/f_auto,c_limit,w_600,q_auto/sample.jpg'
      )
    })

    it('applies custom quality if provided', () => {
      const url =
        'https://res.cloudinary.com/demo/image/upload/v12345/sample.jpg'
      const result = cloudinaryLoader({ src: url, width: 400, quality: 70 })
      expect(result).toBe(
        'https://res.cloudinary.com/demo/image/upload/f_auto,c_limit,w_400,q_70/sample.jpg'
      )
    })

    it('does not transform SVGs', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/v12345/icon.svg'
      const result = cloudinaryLoader({ src: url, width: 300 })
      expect(result).toBe(
        'https://res.cloudinary.com/demo/image/upload/icon.svg'
      )
    })

    it('returns original URL if not Cloudinary', () => {
      const url = 'https://example.com/image.jpg'
      expect(cloudinaryLoader({ src: url, width: 500 })).toBe(url)
    })

    it('returns original URL if already contains params', () => {
      const url =
        'https://res.cloudinary.com/demo/image/upload/c_limit,w_200/sample.jpg'
      expect(cloudinaryLoader({ src: url, width: 800 })).toBe(url)
    })

    it('returns original URL if cloud name or public ID missing', () => {
      const url = 'https://res.cloudinary.com//image/upload/v12345/'
      expect(cloudinaryLoader({ src: url, width: 500 })).toBe(url)
    })
  })
})
