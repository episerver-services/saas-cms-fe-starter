import type { MetadataRoute } from 'next'

/**
 * Robots.txt configuration for Optimizely SaaS FE.
 * 
 * - Disallows preview and draft routes
 * - Allows indexing of all published locales
 * - Prevents caching of sensitive routes
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: ['/draft/', '/preview/'],
        allow: ['/'],
      },
    ],
    sitemap: 'https://www.yoursite.com/sitemap.xml',
  }
}