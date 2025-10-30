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
 * Supports Optimizely SaaS CMS Visual Builder editing by allowing preview access
 * to specific page versions via `/draft/{version}/{...slug}`.
 *
 * If draft mode is not permitted, this will trigger Next.js 404 (`notFound()`).
 *
 * @param params - Route params provided by Next.js
 * @param params.version - The Visual Builder draft version (GUID)
 * @param params.slug - Optional slug path for the previewed page (e.g. `about-us`)
 * @returns A React tree for the draft page or a fallback error UI when fetching fails
 */
export default async function CmsPage({
  params,
}: {
  params: Promise<{ version: string; slug?: string }>
}) {
  const { version, slug = '' } = await params

  const isDraftModeEnabled = await checkDraftMode()
  if (!isDraftModeEnabled) return notFound()

  let pageResponse:
    | {
        StartPage?: { item?: { blocks?: unknown[] | null } | null }
      }
    | undefined

  try {
    pageResponse = await optimizely.GetPreviewStartPage({
      version,
      locales: [], // no locales required in this starter
    })
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

  const page = pageResponse?.StartPage?.item
  const blocks = (page?.blocks ?? []).filter(Boolean)

  if (!blocks.length) return notFound()

  return (
    <div className="container py-10" data-epi-edit="blocks">
      {process.env.NEXT_PUBLIC_MOCK_OPTIMIZELY !== 'true' && (
        <OnPageEdit
          version={version}
          currentRoute={`/draft/${version}/${slug}`}
        />
      )}
      <ContentAreaMapper blocks={blocks} preview />
    </div>
  )
}
