import cloudinaryLoader from './cloudinary-loader'
import { getOptimizedImageUrl } from './cdn-image'

/**
 * Smart image loader for Next.js `<Image />`.
 *
 * Routing rules:
 * - **Cloudinary URL** → delegates to the Cloudinary loader (adds width/quality transforms).
 * - **Relative path** (e.g. `/globalassets/foo.jpg`) → rewrites for CDN optimisation (Cloudflare images).
 * - **Anything else** → passthrough unchanged.
 *
 * Notes:
 * - Empty/whitespace `src` returns an empty string.
 * - If `width` is not a positive number (shouldn’t happen with Next), returns the original `src`.
 *
 * @example
 * // Cloudinary
 * imageLoader({ src: 'https://res.cloudinary.com/demo/image/upload/v1/pic.jpg', width: 800 })
 *
 * // Relative CMS asset
 * imageLoader({ src: '/globalassets/pic.jpg', width: 600, quality: 80 })
 *
 * // External passthrough
 * imageLoader({ src: 'https://example.com/pic.jpg', width: 600 })
 *
 * @param src - Original image URL or path.
 * @param width - Desired output width in pixels (provided by Next).
 * @param quality - Optional quality hint; loaders decide defaults.
 * @returns URL string suitable for Next `<Image loader={imageLoader} />`.
 */
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}): string {
  const cleanSrc = (src ?? '').trim()
  if (!cleanSrc) return ''

  // Sanity guard — Next should always pass a positive width.
  if (!(typeof width === 'number' && isFinite(width) && width > 0)) {
    return cleanSrc
  }

  // Cloudinary-hosted assets
  if (cleanSrc.startsWith('https://res.cloudinary.com')) {
    return cloudinaryLoader({ src: cleanSrc, width, quality })
  }

  // Relative CMS assets via CDN (Cloudflare Images)
  if (cleanSrc.startsWith('/')) {
    return getOptimizedImageUrl(cleanSrc, { width, quality })
  }

  // External/unsupported → passthrough
  return cleanSrc
}
