'use client'

import { useEffect } from 'react'
import CTAButton from '@/app/components/ui/cta-button'

/**
 * A generic fallback UI for GraphQL or runtime rendering errors.
 * Displays an optional title, message, and link back to the homepage.
 *
 * @param title - Heading displayed to the user (default: "Something went wrong")
 * @param message - Descriptive error message (default: "We couldn’t load this content.")
 * @param showHomeLink - Whether to show a link back to the homepage
 * @param error - Optional error object for dev-time logging
 */
export default function FallbackErrorUI({
  title = 'Something went wrong',
  message = 'We couldn’t load this content. Please try again later.',
  showHomeLink = true,
  error,
}: {
  title?: string
  message?: string
  showHomeLink?: boolean
  error?: unknown
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('GraphQL error fallback:', error)
    }
  }, [error])

  return (
    <main
      role="alert"
      className="flex min-h-screen flex-col items-center justify-center bg-background px-3 text-foreground text-center"
    >
      <span aria-hidden="true" className="text-6xl mb-6">
        🚧
      </span>
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground mb-6">{message}</p>
      {showHomeLink && (
        <CTAButton
          textDesktop="Go back home"
          link={{ href: '/', ariaLabel: 'Go back to homepage' }}
        />
      )}
    </main>
  )
}
