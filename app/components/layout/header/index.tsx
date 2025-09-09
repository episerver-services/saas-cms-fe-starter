'use client'

import Link from 'next/link'

/**
 * Placeholder global header.
 *
 * Provides a static brand link and navigation menu.
 * Replace with a CMS-driven header when content is available.
 */
export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Company Name
          </Link>

          <nav aria-label="Main navigation" className="hidden md:flex gap-6">
            <Link href="/about" className="text-sm font-medium hover:underline">
              About
            </Link>
            <Link
              href="/services"
              className="text-sm font-medium hover:underline"
            >
              Services
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium hover:underline"
            >
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
