import ContentAreaMapper from '@/app/components/content-area/mapper'
import FallbackErrorUI from '@/app/components/errors/fallback-error-ui'
import OnPageEdit from '@/app/components/draft/on-page-edit'
import { optimizely } from '@/lib/optimizely/fetch'
import { checkDraftMode } from '@/lib/utils/draft-mode'
import { notFound } from 'next/navigation'

/**
 * Disables ISR and enables dynamic rendering for this page.
 */
export const revalidate = 0
export const dynamic = 'force-dynamic'

/**
 * Visual Builder draft preview route for rendering unpublished CMS content.
 *
 * This route supports Optimizely SaaS CMS Visual Builder editing by allowing preview access
 * to specific page versions. It is accessed through URLs like:
 *
 * `/draft/{version}/{...slug}`
 *
 * ### Params:
 * @param params.version - A unique draft version ID (GUID) from Visual Builder
 * @param params.slug - Optional slug path for the previewed page (e.g., `about-us`)
 *
 * @returns React layout with CMS-rendered blocks, or fallback UI if an error occurs.
 */
export default async function CmsPage({
  params,
}: {
  params: Promise<{ version: string; slug?: string }>
}) {
  const { version, slug = '' } = await params

  const isDraftModeEnabled = await checkDraftMode()
  if (!isDraftModeEnabled) return notFound()

  try {
    const pageResponse = await optimizely.GetPreviewStartPage({
      version,
      locales: [], // No need to pass locales in your reset state
    })

    const page = pageResponse?.StartPage?.item
    const blocks = (page?.blocks ?? []).filter(Boolean)

    if (!blocks.length) return notFound()

    return (
      <div className="container py-10" data-epi-edit="blocks">
        {process.env.MOCK_OPTIMIZELY !== 'true' && (
          <OnPageEdit
            version={version}
            currentRoute={`/draft/${version}/${slug}`}
          />
        )}
        <ContentAreaMapper blocks={blocks} preview />
      </div>
    )
  } catch (err) {
    return (
      <FallbackErrorUI
        title="Failed to load draft content"
        message="An error occurred while retrieving the unpublished content from the CMS."
        showHomeLink
        error={err}
      />
    )
  }
}
