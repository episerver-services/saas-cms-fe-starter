'use client'

import { useEffect } from 'react'
import CTAButton from '@/app/components/ui/cta-button'

/**
 * A generic fallback UI for runtime rendering or GraphQL errors.
 *
 * Intended as a last-resort error boundary for CMS-driven routes or components.
 * Provides a clear message to the user while optionally logging the error
 * for developers in development mode.
 *
 * @param title - Heading displayed to the user (default: "Something went wrong")
 * @param message - Descriptive error message (default: "We couldn’t load this content. Please try again later.")
 * @param showHomeLink - Whether to show a link back to the homepage (default: true)
 * @param error - Optional error object, logged only in development mode
 * @returns A styled `<main>` element with error UI and optional navigation link
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
