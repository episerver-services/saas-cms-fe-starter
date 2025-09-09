import imageLoader from './next-image-loader'

// Mock the delegate loaders so we can assert routing + args
jest.mock('./cloudinary-loader', () => ({
  __esModule: true,
  default: jest.fn(() => 'CLOUD_OUT'),
}))
jest.mock('./cdn-image', () => ({
  __esModule: true,
  getOptimizedImageUrl: jest.fn(() => 'CDN_OUT'),
}))

import cloudinaryLoader from './cloudinary-loader'
import { getOptimizedImageUrl } from './cdn-image'

describe('next-image-loader (universal imageLoader)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('delegates Cloudinary URLs to cloudinaryLoader with width/quality', () => {
    const src = 'https://res.cloudinary.com/demo/image/upload/v123/foo.jpg'
    const out = imageLoader({ src, width: 640, quality: 70 })

    expect(cloudinaryLoader).toHaveBeenCalledTimes(1)
    expect(cloudinaryLoader).toHaveBeenCalledWith({
      src,
      width: 640,
      quality: 70,
    })
    expect(out).toBe('CLOUD_OUT')

    // cdn path should not be used
    expect(getOptimizedImageUrl).not.toHaveBeenCalled()
  })

  it('delegates relative paths to getOptimizedImageUrl (CDN) with width/quality', () => {
    const src = '/globalassets/img/foo.jpg'
    const out = imageLoader({ src, width: 1024, quality: 80 })

    expect(getOptimizedImageUrl).toHaveBeenCalledTimes(1)
    expect(getOptimizedImageUrl).toHaveBeenCalledWith(src, {
      width: 1024,
      quality: 80,
    })
    expect(out).toBe('CDN_OUT')

    // cloudinary path should not be used
    expect(cloudinaryLoader).not.toHaveBeenCalled()
  })

  it('passes undefined quality through (no defaulting here)', () => {
    const src = '/globalassets/img/foo.jpg'
    imageLoader({ src, width: 500 })

    expect(getOptimizedImageUrl).toHaveBeenCalledWith(src, {
      width: 500,
      quality: undefined,
    })
  })

  it('returns external/unsupported URLs unchanged', () => {
    const src = 'https://example.com/image.png'
    const out = imageLoader({ src, width: 300, quality: 60 })

    expect(out).toBe(src)
    expect(cloudinaryLoader).not.toHaveBeenCalled()
    expect(getOptimizedImageUrl).not.toHaveBeenCalled()
  })

  it('returns empty string for falsy src', () => {
    const out = imageLoader({ src: '', width: 300 })
    expect(out).toBe('')
    expect(cloudinaryLoader).not.toHaveBeenCalled()
    expect(getOptimizedImageUrl).not.toHaveBeenCalled()
  })
})
