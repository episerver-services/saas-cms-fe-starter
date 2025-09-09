import { optimizely } from '@/lib/optimizely/fetch'
import { getValidLocale } from '@/lib/optimizely/utils/language'
import { Suspense } from 'react'
import VisualBuilderExperienceWrapper from '../visual-builder/wrapper'
import { notFound } from 'next/navigation'
import { SafeVisualBuilderExperience } from '@/lib/optimizely/types/experience'
import ContentAreaMapper from '../content-area/mapper'

/**
 * Renders the most recent draft version of a CMS page or Visual Builder experience.
 *
 * This route handler is used exclusively in preview mode (`draftMode`)
 * to show unpublished or in-progress changes.
 *
 * Load order:
 * 1. Attempts to fetch a draft CMS page by slug + locale.
 * 2. If none found, attempts to fetch a Visual Builder (VB) Experience draft.
 * 3. Selects the highest version number from available results.
 * 4. Renders the matching draft content inside a Suspense boundary.
 * 5. Falls back to `notFound()` if no drafts are available.
 *
 * @param locales - Raw locale string from the URL or route params.
 *   Normalized using `getValidLocale`.
 * @param slug - The CMS path or slug used to resolve the draft content.
 * @returns A Suspense-wrapped React node with draft content,
 *   or a Next.js `notFound()` response if no draft exists.
 *
 * @example
 * ```tsx
 * // Usage inside /draft/[...slug]/page.tsx
 * export default function DraftRoute({ params }) {
 *   return (
 *     <DraftModeCmsPage
 *       locales={params.locale}
 *       slug={`/${params.slug?.join('/')}`}
 *     />
 *   )
 * }
 * ```
 */
export default async function DraftModeCmsPage({
  locales,
  slug,
}: {
  locales: string
  slug: string
}) {
  const validLocale = getValidLocale(locales)

  const { CMSPage } = await optimizely.GetAllPagesVersionByURL(
    { locales: [validLocale], slug },
    { preview: true }
  )

  const cmsPageItems = CMSPage?.item ? [CMSPage.item] : []

  // If no CMS pages found, attempt to load a Visual Builder Experience
  if (!cmsPageItems?.length) {
    console.info('No CMS draft found, attempting to load VB experience.')

    const { SEOExperience } =
      await optimizely.GetAllVisualBuilderVersionsBySlug(
        { locales: [validLocale], slug },
        { preview: true }
      )

    const experiences = SEOExperience?.items?.filter(Boolean) as
      | SafeVisualBuilderExperience[]
      | undefined

    const latestExperience =
      experiences?.reduce<SafeVisualBuilderExperience | null>(
        (latest, current) => {
          if (!current || !current._metadata?.version) return latest

          const currentVersion = parseInt(current._metadata.version, 10)
          const latestVersion = latest?._metadata?.version
            ? parseInt(latest._metadata.version, 10)
            : -1

          return currentVersion > latestVersion ? current : latest
        },
        null
      )

    if (latestExperience) {
      return (
        <Suspense fallback={<div>Loading experience preview…</div>}>
          <VisualBuilderExperienceWrapper experience={latestExperience} />
        </Suspense>
      )
    }

    return notFound()
  }

  /**
   * Selects the latest version of a CMS page from the available items.
   * Falls back to null if no valid version is found.
   */
  const latestCmsPage = cmsPageItems.reduce<{
    blocks?: { __typename: string; [key: string]: unknown }[]
    _metadata?: {
      version?: string
      [key: string]: unknown
    }
  } | null>((latest, current) => {
    if (!current || !current._metadata?.version) return latest

    const currentVersion = parseInt(`${current._metadata.version}`, 10)
    const latestVersion = parseInt(`${latest?._metadata?.version ?? -1}`, 10)

    return currentVersion > latestVersion ? current : latest
  }, null)

  if (!latestCmsPage) {
    return notFound()
  }

  const blocks = (latestCmsPage.blocks ?? []).filter(Boolean)

  return (
    <Suspense fallback={<div>Loading CMS preview…</div>}>
      <ContentAreaMapper blocks={blocks} />
    </Suspense>
  )
}
