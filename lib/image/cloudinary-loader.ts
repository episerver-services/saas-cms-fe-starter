/**
 * Regex to extract parts of a Cloudinary URL.
 * Captures: cloud name, asset type, delivery type, transformations, version, and public ID.
 */
const CLOUDINARY_REGEX =
  /^.+\.cloudinary\.com\/([^/]+)\/(?:(image|video|raw)\/)?(?:(upload|fetch|private|authenticated|sprite|facebook|twitter|youtube|vimeo)\/)?(?:(?:[^/]+\/[^,/]+,?)*\/)?(?:v(\d+|\w{1,2})\/)?([^.^\s]+)(?:\.(.+))?$/

/** Detects if transformation parameters already exist in a URL */
const paramFormats = ['f_', 'c_']

/**
 * Extracts the public ID (e.g. `image-name.jpg`) from a Cloudinary URL.
 *
 * @param link - Cloudinary image URL
 * @returns The public ID with extension or empty string on failure
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
 * Extracts the cloud name from a Cloudinary URL.
 *
 * @param link - Cloudinary image URL
 * @returns The cloud name or empty string on failure
 */
const extractCloudName = (link: string): string => {
  if (!link) return ''
  const parts = CLOUDINARY_REGEX.exec(link)
  return parts?.[1] || ''
}

/**
 * Generates a Cloudinary transformation string.
 * Skips if image is SVG, which doesn't benefit from transformation.
 *
 * @param path - Image path
 * @param width - Target width
 * @param quality - Target quality (optional)
 * @returns Cloudinary transformation path string
 */
const getParams = (path: string, width: number, quality?: number): string => {
  const isSVG = path.toLowerCase().endsWith('.svg')
  if (isSVG) return '/'

  const params = [
    'f_auto',
    'c_limit',
    `w_${width || 'auto'}`,
    `q_${quality || 'auto'}`,
  ]

  return `/${params.join(',')}/`
}

/**
 * Next.js-compatible Cloudinary image loader.
 *
 * @param src - Source image URL
 * @param width - Target image width
 * @param quality - Optional target quality
 * @returns Transformed Cloudinary URL, or original URL if not a Cloudinary link
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
    // Prevent re-transforming an already-optimized URL
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
