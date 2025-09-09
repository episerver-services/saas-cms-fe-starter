/**
 * Utility: Rewrites an Optimizely-relative image path to use Cloudflare CDN transforms.
 *
 * If the `src` begins with a leading `/` (e.g. `/globalassets/...`), it is rewritten
 * to include Cloudflare’s image optimization directives. This ensures faster delivery
 * with resizing and quality settings applied at the CDN layer.
 *
 * Cloudflare will automatically cache and serve the optimized image.
 *
 * @example
 * ```ts
 * getOptimizedImageUrl('/globalassets/image.jpg', { width: 600 })
 * // → "/cdn-cgi/image/width=600,quality=75/globalassets/image.jpg"
 * ```
 *
 * @param src - Image path from Optimizely (e.g. `/globalassets/img.jpg`).
 * @param opts - Optional transform options:
 *   - `width`   Target width in pixels (default: 800)
 *   - `quality` Compression quality (default: 75)
 * @returns Optimized URL string, or original `src` if not eligible.
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
