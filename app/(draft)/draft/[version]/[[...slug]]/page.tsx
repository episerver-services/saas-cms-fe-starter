import type { Metadata } from 'next'
import ContentAreaMapper from '@/app/components/content-area/mapper'
import FallbackErrorUI from '@/app/components/errors/fallback-error-ui'
import OnPageEdit from '@/app/components/draft/on-page-edit'
import { optimizely } from '@/lib/optimizely/fetch'
import { checkDraftMode } from '@/lib/utils/draft-mode'
import { notFound } from 'next/navigation'
import { isMockOptimizely } from '@/lib/env'

/**
 * Prevent search engines from indexing draft/preview routes.
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    robots: {
      index: false,
      follow: false,
      nocache: true,
    },
  }
}

export const revalidate = 0
export const dynamic = 'force-dynamic'

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
        StartPage?: {
          item?: {
            blocks?: unknown[] | null
            _metadata?: Record<string, unknown>
          } | null
        }
      }
    | undefined

  try {
    pageResponse = await optimizely.GetPreviewStartPage({
      version,
      locales: [],
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
    <div
      className="container py-10"
      data-epi-edit="blocks"
      data-epi-block-id={page?._metadata?.guid ?? 'draft-root'}
    >
      {!isMockOptimizely() && (
        <OnPageEdit
          version={version}
          currentRoute={`/draft/${version}/${slug}`}
        />
      )}
      <ContentAreaMapper blocks={blocks} />
    </div>
  )
}
