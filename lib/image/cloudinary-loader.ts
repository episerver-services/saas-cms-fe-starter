/**
 * Cloudinary image loader utilities.
 *
 * Provides helpers for extracting Cloudinary identifiers, generating transformation
 * parameters, and producing Next.js-compatible URLs for optimised delivery.
 *
 * Key features:
 * - Extracts cloud name and public ID from Cloudinary URLs
 * - Skips SVGs (no transformation benefit)
 * - Avoids re-applying transforms if already present
 * - Returns the original URL if not a Cloudinary resource
 */

/**
 * Regex to decompose a Cloudinary URL into parts.
 * Captures (if present):
 *  1. Cloud name
 *  2. Asset type (image|video|raw)
 *  3. Delivery type (upload|fetch|private|...)
 *  4. Version (e.g. v123)
 *  5. Public ID (without extension)
 *  6. File extension
 */
const CLOUDINARY_REGEX =
  /^.+\.cloudinary\.com\/([^/]+)\/(?:(image|video|raw)\/)?(?:(upload|fetch|private|authenticated|sprite|facebook|twitter|youtube|vimeo)\/)?(?:(?:[^/]+\/[^,/]+,?)*\/)?(?:v(\d+|\w{1,2})\/)?([^.^\s]+)(?:\.(.+))?$/

/** Known transformation parameter formats to detect pre-optimised URLs. */
const paramFormats = ['f_', 'c_']

/**
 * Extracts the public ID (e.g. `photo.jpg`) from a Cloudinary URL.
 *
 * @param link - Full Cloudinary resource URL
 * @returns The public ID including extension, or empty string if extraction fails
 */
export const extractCloudinaryPublicID = (link: string): string => {
  if (!link) return ''
  const parts = CLOUDINARY_REGEX.exec(link)
  if (parts && parts.length > 2) {
    const path = parts[parts.length - 2]
    const extension = parts[parts.length - 1]
    return `${path}${extension ? '.' + extension : ''}`
  }
  return ''
}

/**
 * Extracts the Cloudinary cloud name from a resource URL.
 *
 * @param link - Full Cloudinary URL
 * @returns Cloud name, or empty string if not found
 */
const extractCloudName = (link: string): string => {
  if (!link) return ''
  const parts = CLOUDINARY_REGEX.exec(link)
  return parts?.[1] || ''
}

/**
 * Generates a Cloudinary transformation string for width/quality.
 * Returns `/` if the asset is SVG, as transformations provide no benefit.
 *
 * @param path - Public ID including extension
 * @param width - Target width in pixels
 * @param quality - Optional compression quality (default: auto)
 * @returns Cloudinary transformation path (e.g. `/f_auto,c_limit,w_600,q_80/`)
 */
const getParams = (path: string, width: number, quality?: number): string => {
  const isSVG = path.toLowerCase().endsWith('.svg')
  if (isSVG) return '/'
  const params = [
    'f_auto', // auto-format for browser
    'c_limit', // prevent upscaling
    `w_${width || 'auto'}`,
    `q_${quality || 'auto'}`,
  ]
  return `/${params.join(',')}/`
}

/**
 * Next.js-compatible Cloudinary image loader.
 *
 * Produces an optimised URL when given a Cloudinary resource; returns the original
 * URL otherwise. Avoids re-transforming if params are already present.
 *
 * @example
 * ```ts
 * cloudinaryLoader({
 *   src: 'https://res.cloudinary.com/demo/image/upload/v123/photo.jpg',
 *   width: 600,
 *   quality: 80
 * })
 * // → "https://res.cloudinary.com/demo/image/upload/f_auto,c_limit,w_600,q_80/photo.jpg"
 * ```
 *
 * @param src - Source image URL
 * @param width - Target image width
 * @param quality - Optional target quality (default: auto)
 * @returns Optimised Cloudinary URL, or the original if not Cloudinary
 */
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}): string {
  if (src.startsWith('https://res.cloudinary.com')) {
    // Prevent re-transforming an already-optimised URL
    if (paramFormats.some((f) => src.includes(f))) {
      return src
    }

    const publicId = extractCloudinaryPublicID(src)
    const cloudName = extractCloudName(src)
    if (!publicId || !cloudName) return src

    const params = getParams(publicId, width, quality)
    return `https://res.cloudinary.com/${cloudName}/image/upload${params}${publicId}`
  }

  return src
}
