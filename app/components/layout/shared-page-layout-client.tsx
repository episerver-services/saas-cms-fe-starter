'use client'

import SharedPageLayout from './shared-page-layout'

/**
 * Client-only wrapper for {@link SharedPageLayout}.
 *
 * This allows server layouts (like `/draft/layout.tsx`) to safely
 * render a client component boundary without triggering
 * "Element type is invalid / Promise resolved to Context.Provider"
 * errors.
 *
 * Use this wrapper **only** when importing `SharedPageLayout`
 * from server components.
 */
export default function SharedPageLayoutClient(
  props: React.ComponentProps<typeof SharedPageLayout>
) {
  return <SharedPageLayout {...props} />
}
