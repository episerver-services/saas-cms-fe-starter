import ContentAreaMapper from '@/app/components/content-area/mapper'
import FallbackErrorUI from '@/app/components/errors/fallback-error-ui'
import { optimizely } from '@/lib/optimizely/fetch'
import { LOCALES, mapPathWithoutLocale } from '@/lib/optimizely/utils/language'
import { generateAlternates } from '@/lib/utils/metadata'
import { resolveSlugAndLocale } from '@/lib/utils/routing'
import { isMockOptimizely } from '@/lib/env'
import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

/**
 * Narrow type for a CMS page item we care about on published routes.
 */
type CMSPageItem = {
  title: string
  shortDescription?: string
  keywords?: string
  blocks?: { __typename: string; [key: string]: unknown }[]
  _metadata?: { modified?: string; [key: string]: unknown }
}

/**
 * Runtime type guard to ensure the page has `_metadata.modified`.
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

/**
 * Build dynamic SEO metadata for published pages.
 *
 * - Uses `resolveSlugAndLocale` to normalize incoming params.
 * - Skips CMS fetch during build or mock mode (safe fallback).
 * - Uses draftMode only to decide preview vs published for metadata fetch.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const { localeCode, formattedSlug } = resolveSlugAndLocale(locale, slug)

  if (process.env.IS_BUILD === 'true' || isMockOptimizely()) {
    console.warn(
      '[generateMetadata] Using fallback due to IS_BUILD or NEXT_PUBLIC_MOCK_OPTIMIZELY'
    )
    return { title: 'Optimizely Page', description: '' }
  }

  try {
    const { isEnabled } = await draftMode()
    const pageData = await optimizely.getPageByURL(
      { locales: [localeCode], slug: formattedSlug },
      { preview: isEnabled }
    )

    const item = pageData?.CMSPage?.item
    if (!item || typeof item !== 'object' || !('title' in item)) {
      return { title: `Optimizely Page${slug ? ` - ${slug.join('/')}` : ''}` }
    }

    const page = item as CMSPageItem
    return {
      title: page.title,
      description: page.shortDescription || '',
      keywords: page.keywords ?? '',
      alternates: generateAlternates(localeCode, formattedSlug),
    }
  } catch (error) {
    console.error('generateMetadata fallback:', error)
    return { title: `Optimizely Page${slug ? ` - ${slug.join('/')}` : ''}` }
  }
}

/**
 * Provide route params for pre-rendering.
 *
 * Today: `LOCALES = ['en']` → single-locale emission.
 * Tomorrow: add locales to `LOCALES` and this automatically expands.
 */
export async function generateStaticParams(): Promise<
  Array<{ locale: string; slug?: string[] }>
> {
  if (process.env.IS_BUILD === 'true' || isMockOptimizely()) {
    console.warn(
      '[generateStaticParams] Skipped due to IS_BUILD or NEXT_PUBLIC_MOCK_OPTIMIZELY'
    )
    return []
  }

  try {
    const pageTypes = ['CMSPage']
    const resp = await optimizely.AllPages?.({ pageType: pageTypes })
    const items = resp?._Content?.items ?? []

    const unique = new Set<string>()
    for (const it of items) {
      const url = it?._metadata?.url?.default
      if (typeof url === 'string') unique.add(mapPathWithoutLocale(url))
    }

    const slugs = Array.from(unique).map((s) => s.split('/').filter(Boolean))

    const params: Array<{ locale: string; slug?: string[] }> = []
    for (const loc of LOCALES) {
      for (const parts of slugs) {
        params.push({ locale: loc, slug: parts.length ? parts : undefined })
      }
    }
    return params
  } catch (e) {
    console.error('generateStaticParams fallback:', e)
    return []
  }
}

/**
 * Published (non-draft) page route.
 *
 * - Ignores draft mode and always requests published content.
 * - Renders mapped blocks; 404s on missing/invalid pages.
 * - Uses Suspense fallback while the block tree resolves.
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
      { locales: [localeCode], slug: formattedSlug },
      { preview: false }
    )
    const item = pageData?.CMSPage?.item
    if (item && typeof item === 'object') page = item as CMSPageItem
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

  if (!page || !hasModifiedMetadata(page)) return notFound()

  const blocks = (page.blocks ?? []).filter(Boolean)

  return (
    <Suspense fallback={<div>Loading page content...</div>}>
      <ContentAreaMapper blocks={blocks} />
    </Suspense>
  )
}

/** Incremental Static Regeneration window (seconds). */
export const revalidate = 60
