'use client'

import { useRouter, usePathname } from 'next/navigation'
import CTAButton from '@/app/components/ui/cta-button'

/**
 * Renders draft-only action buttons for editors when running in mock Optimizely mode.
 *
 * This component only appears if:
 * - `NEXT_PUBLIC_MOCK_OPTIMIZELY === 'true'`
 * - The current pathname begins with `/draft/`
 *
 * When visible, it provides two actions:
 * - **Refresh Page** → Calls `router.refresh()` to reload CMS draft content.
 * - **Disable Draft** → Sends a request to `/api/draft/disable`, then refreshes the page to exit draft mode.
 *
 * @param props - Component props
 * @param props.pathname - Optional pathname override (mainly for tests).
 *   If omitted, the current pathname is read via Next.js `usePathname()`.
 *
 * @returns React element with action buttons, or `null` if draft actions are not applicable.
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
            await fetch('/api/preview/disable')
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
