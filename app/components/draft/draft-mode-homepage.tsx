import { optimizely } from '@/lib/optimizely/fetch'
import { getValidLocale } from '@/lib/optimizely/utils/language'
import { Suspense } from 'react'
import ContentAreaMapper from '../content-area/mapper'

/**
 * Renders the latest version of the Start Page in Draft Mode.
 * Intended for use on preview routes when editors want to see the most recent unpublished state.
 *
 * @param locales - The current locale as a string, used to fetch localised draft content
 * @returns A React component that renders blocks using ContentAreaMapper, or null during builds or on error
 */
export default async function DraftModeHomePage({
  locales,
}: {
  locales: string
}) {
  // Avoid rendering during build time
  if (process.env.IS_BUILD === 'true') {
    console.warn('IS_BUILD is true, skipping DraftModeHomePage render')
    return null
  }

  const validLocale = getValidLocale(locales)

  try {
    const { StartPage } = await optimizely.GetAllStartPageVersions(
      { locales: [validLocale] },
      { preview: true }
    )

    const startPageItems = StartPage?.items ?? []

    // Determine the highest version number among all versions
    const maxStartPageVersion = Math.max(
      ...startPageItems.map((item) =>
        parseInt(item?._metadata?.version || '0', 10)
      )
    )

    // Find the most recent version to render
    const page = startPageItems.find(
      (p) => parseInt(p?._metadata?.version || '0', 10) === maxStartPageVersion
    )

    const blocks = (page?.blocks ?? []).filter(Boolean)

    return (
      <Suspense>
        <ContentAreaMapper blocks={blocks} />
      </Suspense>
    )
  } catch (e) {
    console.error('DraftModeHomePage fallback:', e)
    return null
  }
}
