import type { ReactElement, ReactNode } from 'react'
import SharedPageLayout from '@/app/components/layout/shared-page-layout'
import { Heading } from '@/app/components/ui/heading'

/**
 * Root layout for published routes.
 *
 * Wraps all public pages with the shared site chrome (header/footer, etc.)
 * and adds a simple section heading to distinguish the published surface.
 *
 * @param children - Route segment content to render inside the shared layout
 * @returns {ReactElement} The shared page layout wrapping the route content
 */
export default function RootLayout({
  children,
}: {
  children: ReactNode
}): ReactElement {
  return (
    <SharedPageLayout>
      <Heading label="Published Route" />
      {children}
    </SharedPageLayout>
  )
}
