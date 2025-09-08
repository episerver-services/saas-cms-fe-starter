'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import CTAButton from '@/app/components/ui/cta-button'

/**
 * UI component for displaying draft-only page actions.
 *
 * This component renders within `/draft/` routes when `NEXT_PUBLIC_MOCK_OPTIMIZELY` is set to `'true'`,
 * allowing editors to refresh content or exit draft mode. It will not render in published routes,
 * and auto-hides in production or non-mock environments.
 *
 * Buttons:
 * - "Refresh Page": Re-fetches updated CMS draft content.
 * - "Disable Draft": Calls `/api/draft/disable` to exit Next.js draft mode.
 *
 * @returns A floating button group for draft preview pages, or null if not eligible.
 *
 * @example
 * <DraftActions />
 */
const DraftActions = () => {
  const router = useRouter()
  const pathname = usePathname()
  const [showActions, setShowActions] = useState(false)

  useEffect(() => {
    const isMock = process.env.NEXT_PUBLIC_MOCK_OPTIMIZELY === 'true'
    const isDraftRoute = pathname?.startsWith('/draft/')
    setShowActions(isMock && isDraftRoute)
  }, [pathname])

  if (!showActions) return null

  return (
    <div className="flex justify-end gap-5 p-4">
      <CTAButton textDesktop="Refresh Page" onClick={() => router.refresh()} />
      <CTAButton
        textDesktop="Disable Draft"
        onClick={async () => {
          try {
            await fetch('/api/draft/disable')
            router.refresh()
          } catch (err) {
            console.error('Failed to disable draft mode:', err)
          }
        }}
      />
    </div>
  )
}

export default DraftActions
