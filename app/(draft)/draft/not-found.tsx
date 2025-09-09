import CTAButton from '@/app/components/ui/cta-button'
import type { Metadata } from 'next'

/**
 * SEO metadata for the 404 page.
 * Prevents indexing and signals to crawlers this page should not be followed.
 */
export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: {
    index: false,
    follow: false,
  },
}

/**
 * Renders the 404 "Not Found" error page.
 *
 * This page is displayed when no CMS content is found or a route fails to resolve.
 * Includes a visually prominent heading, descriptive message, and a CTA back to homepage.
 *
 * @returns {ReactElement} A styled <main> element representing the 404 UI.
 */
export default function NotFound() {
  return (
    <main
      role="main"
      aria-labelledby="page-title"
      className="flex min-h-screen flex-col items-center justify-center bg-background px-3 text-foreground"
    >
      <h1 id="page-title" className="mb-4 text-4xl font-bold">
        404 – Page Not Found
      </h1>
      <p className="mb-8 text-xl text-muted-foreground">
        Oops! The page you’re looking for doesn’t exist.
      </p>
      <CTAButton
        textDesktop="Go back home"
        link={{ href: '/', ariaLabel: 'Go back to homepage' }}
      />
    </main>
  )
}
