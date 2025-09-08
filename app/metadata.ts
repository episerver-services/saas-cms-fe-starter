import type { Metadata } from 'next'

/**
 * The fallback title for all pages if no CMS or SEO content is available.
 */
const FALLBACK_TITLE = 'My Site – Modern CMS-Powered Experience'

/**
 * The fallback description for all pages.
 */
const FALLBACK_DESCRIPTION =
  'A flexible, high-performance site powered by a modern CMS and built with cutting-edge frontend technologies.'

/**
 * Site domain used in Open Graph metadata. Defaults to localhost during development.
 */
const SITE_DOMAIN = process.env.SITE_DOMAIN || 'http://localhost:3000'

/**
 * Default metadata used across the site when no specific metadata is provided.
 */
export const metadata: Metadata = {
  title: FALLBACK_TITLE,
  description: FALLBACK_DESCRIPTION,
  openGraph: {
    title: FALLBACK_TITLE,
    description: FALLBACK_DESCRIPTION,
    url: SITE_DOMAIN,
    siteName: 'My Site',
    locale: 'en_US',
    // Note: `type` intentionally omitted for type safety
  },
  twitter: {
    title: FALLBACK_TITLE,
    description: FALLBACK_DESCRIPTION,
    // Note: `card` intentionally omitted, rely on images for card type inference
    images: [`${SITE_DOMAIN}/og-image.jpg`],
  },
}
