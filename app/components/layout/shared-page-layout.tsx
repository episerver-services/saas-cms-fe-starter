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
 * Includes:
 * - Placeholder fonts (Geist Sans + Mono)
 * - Skip link for accessibility
 * - Global site structure: Header, Footer, Main
 * - Optional CMS preview JS injector (Optimizely)
 * - Web Vitals script for analytics/debugging
 *
 * @param props.locale - Site language (default: "en")
 * @param props.children - React page content
 * @param props.includeCMSPreview - If true, injects Optimizely CMS communication JS (for preview/editing)
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
  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="antialiased">
        {/* CMS editor script — only loaded in production with explicit opt-in */}
        {includeCMSPreview && process.env.NODE_ENV === 'production' && (
          <Script
            src={`${process.env.NEXT_PUBLIC_CMS_URL}/util/javascript/communicationinjector.js`}
            strategy="afterInteractive"
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
