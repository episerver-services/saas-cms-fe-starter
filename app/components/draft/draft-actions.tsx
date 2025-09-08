'use client'

import { useRouter, usePathname } from 'next/navigation'
import CTAButton from '@/app/components/ui/cta-button'

/**
 * UI component for displaying draft-only page actions.
 *
 * Renders within `/draft/` routes when `NEXT_PUBLIC_MOCK_OPTIMIZELY` is `'true'`,
 * allowing editors to refresh content or exit draft mode.
 *
 * Buttons:
 * - "Refresh Page": Re-fetches updated CMS draft content.
 * - "Disable Draft": Calls `/api/draft/disable` to exit Next.js draft mode.
 *
 * To ease testing, consumers may pass `pathname` explicitly; otherwise we read it
 * from Next's `usePathname()` hook.
 */
type DraftActionsProps = {
  /** Optional pathname override (mainly for tests). If omitted, uses usePathname(). */
  pathname?: string | null
}

const DraftActions = ({ pathname: injectedPathname }: DraftActionsProps) => {
  const router = useRouter()
  // ✅ Call the hook unconditionally, then choose the value
  const hookPathname = usePathname()
  const pathname = injectedPathname ?? hookPathname

  const isMock = process.env.NEXT_PUBLIC_MOCK_OPTIMIZELY === 'true'
  const isDraftRoute = !!pathname && pathname.startsWith('/draft/')
  const showActions = isMock && isDraftRoute

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
            // Swallow to avoid breaking editor flow
            console.error('Failed to disable draft mode:', err)
          }
        }}
      />
    </div>
  )
}

export default DraftActions
