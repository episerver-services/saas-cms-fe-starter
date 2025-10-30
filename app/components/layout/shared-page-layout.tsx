'use client'

import '@/app/globals.css'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import { Suspense } from 'react'
import VitalsInit from '@/app/components/vitals-init'
import Header from '@/app/components/layout/header'
import Footer from '@/app/components/layout/footer'

// Load placeholder fonts for the site (applied via CSS variables)
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

/**
 * Shared layout wrapper for all CMS-rendered pages.
 *
 * Responsibilities:
 * - Load placeholder fonts (Geist Sans + Geist Mono) via CSS variables
 * - Provide a consistent site structure: Header, Footer, and <main>
 * - Inject a skip link for accessibility navigation
 * - Optionally include the Optimizely CMS preview communication script
 * - Initialise Web Vitals monitoring for analytics/debugging
 *
 * @param locale - Document language, applied to the <html> tag (default: "en")
 * @param children - React node tree for the current page
 * @param includeCMSPreview - If true, injects Optimizely CMS preview script
 */
export default function SharedPageLayout({
  locale = 'en',
  children,
  includeCMSPreview = false,
}: {
  locale?: string
  children: React.ReactNode
  includeCMSPreview?: boolean
}) {
  const cmsUrl = process.env.NEXT_PUBLIC_CMS_URL

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="antialiased">
        {/* CMS editor script — now loads in all environments (not just production) */}
        {includeCMSPreview && cmsUrl && (
          <Script
            src={`${cmsUrl}/util/javascript/communicationinjector.js`}
            strategy="afterInteractive"
            onLoad={() =>
              console.info(
                '✅ Optimizely communication injector loaded successfully.'
              )
            }
            onError={(e) =>
              console.warn(
                '⚠️ Failed to load communicationinjector.js. Check NEXT_PUBLIC_CMS_URL and network access.',
                e
              )
            }
          />
        )}

        <VitalsInit />

        {/* Accessibility: Skip to main content */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only absolute left-4 top-4 z-50 rounded bg-black px-4 py-2 text-white"
        >
          Skip to main content
        </a>

        <Suspense>
          <Header />
        </Suspense>

        <main id="main-content" className="container mx-auto min-h-screen px-4">
          {children}
        </main>

        <Suspense>
          <Footer />
        </Suspense>
      </body>
    </html>
  )
}