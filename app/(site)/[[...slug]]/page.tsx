import ContentAreaMapper from '@/app/components/content-area/mapper'
import FallbackErrorUI from '@/app/components/errors/fallback-error-ui'
import { optimizely } from '@/lib/optimizely/fetch'
import { mapPathWithoutLocale } from '@/lib/optimizely/utils/language'
import { generateAlternates } from '@/lib/utils/metadata'
import { resolveSlugAndLocale } from '@/lib/utils/routing'
import { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

/**
 * Type guard to check if a CMS page object includes `_metadata.modified`.
 *
 * @param page - Unknown object to check.
 * @returns `true` if object contains a `_metadata.modified` string.
 */
function hasModifiedMetadata(
  page: unknown
): page is { _metadata: { modified: string } } {
  return (
    typeof page === 'object' &&
    page !== null &&
    '_metadata' in page &&
    typeof (page as any)._metadata?.modified === 'string'
  )
}

type CMSPageItem = {
  title: string
  shortDescription?: string
  keywords?: string
  blocks?: {
    __typename: string
    [key: string]: unknown
  }[]
  _metadata?: {
    modified?: string
    [key: string]: unknown
  }
}

/**
 * Generates SEO metadata for a CMS page at runtime.
 *
 * Fetches title, description, keywords, and alternate URLs from the CMS.
 * Handles fallback cases for build-time or mock environments.
 *
 * @param props - Route props containing dynamic `locale` and optional `slug`.
 * @returns A `Metadata` object for use with Next.js head rendering.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const { localeCode, formattedSlug } = resolveSlugAndLocale(locale, slug)

  if (
    process.env.IS_BUILD === 'true' ||
    process.env.MOCK_OPTIMIZELY === 'true'
  ) {
    console.warn(
      '[generateMetadata] Using fallback due to IS_BUILD or MOCK_OPTIMIZELY'
    )
    return {
      title: 'Optimizely Page',
      description: '',
    }
  }

  try {
    const { isEnabled: isDraftModeEnabled } = await draftMode()
    console.log('[CMS Page] Draft mode?', isDraftModeEnabled)

    const pageData = await optimizely.getPageByURL(
      {
        locales: [localeCode],
        slug: formattedSlug,
      },
      {
        preview: isDraftModeEnabled,
      }
    )

    const item = pageData?.CMSPage?.item

    if (!item || typeof item !== 'object' || !('title' in item)) {
      console.warn('[generateMetadata] No valid CMSPage item found')
      return {
        title: `Optimizely Page${slug ? ` - ${slug.join('/')}` : ''}`,
      }
    }

    const page = item as CMSPageItem

    return {
      title: page.title,
      description: page.shortDescription || '',
      keywords: page.keywords ?? '',
      alternates: generateAlternates(locale, formattedSlug),
    }
  } catch (error) {
    console.error('generateMetadata fallback:', error)
    return {
      title: `Optimizely Page${slug ? ` - ${slug.join('/')}` : ''}`,
    }
  }
}

/**
 * Generates dynamic route parameters for all CMS pages.
 *
 * Used by Next.js to pre-render paths for static generation or ISR.
 * Skips execution in build or mock environments.
 *
 * @returns An array of `{ slug: string[] }` route params.
 */
export async function generateStaticParams() {
  if (
    process.env.IS_BUILD === 'true' ||
    process.env.MOCK_OPTIMIZELY === 'true'
  ) {
    console.warn(
      '[generateStaticParams] Skipped due to IS_BUILD or MOCK_OPTIMIZELY'
    )
    return []
  }

  try {
    const pageTypes = ['CMSPage']
    const pathsResp = await optimizely.AllPages?.({ pageType: pageTypes })

    const paths = pathsResp?._Content?.items ?? []

    const uniquePaths = new Set<string>()
    paths.forEach((path) => {
      const metadata = path?._metadata
      if (
        metadata &&
        typeof metadata === 'object' &&
        'url' in metadata &&
        typeof metadata.url?.default === 'string'
      ) {
        uniquePaths.add(mapPathWithoutLocale(metadata.url.default))
      }
    })

    return Array.from(uniquePaths).map((slug) => ({
      slug: slug.split('/').filter(Boolean),
    }))
  } catch (e) {
    console.error('generateStaticParams fallback:', e)
    return []
  }
}

/**
 * Renders a published CMS page (non-draft).
 *
 * This is the main route handler for production content pages.
 * It ignores draft mode and always fetches published content by slug and locale.
 * Falls back to error or 404 if content is missing or malformed.
 *
 * @param props - Async route params containing locale and optional slug array.
 * @returns A full CMS page layout, or fallback/404 content.
 */
export default async function CmsPage({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>
}) {
  const { locale, slug } = await params
  const { localeCode, formattedSlug } = resolveSlugAndLocale(locale, slug)

  let page: CMSPageItem | null = null
  try {
    const pageData = await optimizely.getPageByURL(
      {
        locales: [localeCode],
        slug: formattedSlug,
      },
      {
        preview: false,
      }
    )

    const item = pageData?.CMSPage?.item

    if (item && typeof item === 'object') {
      page = item as CMSPageItem
    }
  } catch (err) {
    return (
      <FallbackErrorUI
        title="Failed to load content"
        message="An error occurred while retrieving this page from the CMS."
        showHomeLink
        error={err}
      />
    )
  }

  if (!page || !hasModifiedMetadata(page)) {
    return notFound()
  }

  const blocks = (page.blocks ?? []).filter(Boolean)

  return (
    <Suspense fallback={<div>Loading page content...</div>}>
      <ContentAreaMapper blocks={blocks} />
    </Suspense>
  )
}

export const revalidate = 60
