/**
 * Rewrites a relative Optimizely image path to use Cloudflare CDN transforms.
 *
 * Prepends the Cloudflare image transformation directive to an image URL
 * if it's a relative path. This improves performance by optimising
 * image delivery via width and quality settings.
 *
 * Example:
 *   getOptimizedImageUrl('/globalassets/image.jpg', { width: 600 })
 *   ➜ /cdn-cgi/image/width=600,quality=75/globalassets/image.jpg
 *
 * @param src - A relative image path from Optimizely (e.g., `/globalassets/img.jpg`).
 * @param opts - Optional image settings: width and quality.
 * @returns A transformed URL string, or the original if not eligible.
 */
export function getOptimizedImageUrl(
  src: string,
  opts: { width?: number; quality?: number } = {}
): string {
  const { width = 800, quality = 75 } = opts

  // Only rewrite relative paths (Optimizely images like /globalassets/...)
  if (!src.startsWith('/')) return src

  return `/cdn-cgi/image/width=${width},quality=${quality}${src}`
}
