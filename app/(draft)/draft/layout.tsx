import DraftActions from '@/app/components/draft/draft-actions'
import SharedPageLayout from '@/app/components/layout/shared-page-layout'
import { Heading } from '@/app/components/ui/heading'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Root layout for all draft preview routes.
 *
 * Adds CMS preview script and floating editor controls,
 * while reusing the site's shared header/footer structure.
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
