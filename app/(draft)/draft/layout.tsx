import DraftActions from '@/app/components/draft/draft-actions'
import SharedPageLayout from '@/app/components/layout/shared-page-layout'
import { Heading } from '@/app/components/ui/heading'

/**
 * Disable ISR and force dynamic rendering for all draft routes.
 */
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Root layout wrapper for **draft/preview routes**.
 *
 * Provides the site’s shared header/footer structure while adding:
 * - The CMS preview script
 * - Floating editor controls (`DraftActions`)
 * - A visual heading for context in preview mode
 *
 * @param children - The nested draft route content to render.
 * @param params - Dynamic route parameters wrapped in a Promise (App Router convention).
 * @param params.locale - The active locale, passed through to `SharedPageLayout`.
 *
 * @returns A React layout including shared site chrome, CMS preview helpers,
 * and the child content for the current draft route.
 *
 * @throws Will propagate errors if `params` fails to resolve.
 */
export default async function DraftLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <SharedPageLayout locale={locale} includeCMSPreview>
      <DraftActions />
      <Heading label="Draft/Preview Route" />
      {children}
    </SharedPageLayout>
  )
}
