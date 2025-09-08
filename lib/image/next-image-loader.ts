import cloudinaryLoader from './cloudinary-loader'
import { getOptimizedImageUrl } from './cdn-image'

/**
 * A universal image loader for Next.js <Image> component.
 *
 * Automatically detects Cloudinary or relative URLs and delegates transformation:
 * - Cloudinary URLs: Uses Cloudinary transformation parameters.
 * - Relative CMS image paths (e.g. `/globalassets/foo.jpg`): Rewritten for CDN optimization.
 * - External or unsupported URLs are returned unchanged.
 *
 * @param src - The original image URL.
 * @param width - The desired width of the image.
 * @param quality - Optional image quality setting (defaults handled by loaders).
 * @returns A transformed or passthrough URL appropriate for use with <Image loader />.
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
  if (!src) return ''

  // Handle Cloudinary-hosted assets
  if (src.startsWith('https://res.cloudinary.com')) {
    return cloudinaryLoader({ src, width, quality })
  }

  // Handle relative CMS assets via CDN
  if (src.startsWith('/')) {
    return getOptimizedImageUrl(src, { width, quality })
  }

  // External or unsupported asset - return unchanged
  return src
}
