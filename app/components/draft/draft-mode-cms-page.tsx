import { optimizely } from '@/lib/optimizely/fetch'
import { getValidLocale } from '@/lib/optimizely/utils/language'
import { Suspense } from 'react'
import VisualBuilderExperienceWrapper from '../visual-builder/wrapper'
import { notFound } from 'next/navigation'
import { SafeVisualBuilderExperience } from '@/lib/optimizely/types/experience'
import ContentAreaMapper from '../content-area/mapper'

/**
 * Renders the latest draft version of a CMS page or a Visual Builder experience.
 * Used during preview mode to reflect unsaved or in-progress changes.
 *
 * @param locales - The raw locale string from the URL or params
 * @param slug - The content path (slug) for identifying the page or experience
 * @returns A Suspense-wrapped React component tree or a notFound() call
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
