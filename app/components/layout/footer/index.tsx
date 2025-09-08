'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t bg-white py-10">
      <div className="container mx-auto px-4 text-sm text-center text-gray-600">
        <nav className="mb-4 flex justify-center gap-6">
          <Link href="/about" className="hover:underline">
            About
          </Link>
          <Link href="/services" className="hover:underline">
            Services
          </Link>
          <Link href="/contact" className="hover:underline">
            Contact
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
        </nav>

        <p>© {new Date().getFullYear()} Company Name. All rights reserved.</p>
      </div>
    </footer>
  )
}