import { optimizely } from '@/lib/optimizely/fetch'
import { getValidLocale } from '@/lib/optimizely/utils/language'
import { Suspense } from 'react'
import ContentAreaMapper from '../content-area/mapper'

/**
 * Renders the most recent draft version of the site’s Start Page.
 *
 * This is used in preview (`draftMode`) to let editors see unpublished
 * or in-progress changes for the Start Page content.
 *
 * Behavior:
 * - Skips rendering entirely if `process.env.IS_BUILD === 'true'` to avoid
 *   draft queries during build/SSG.
 * - Fetches all draft versions of the Start Page for the given locale.
 * - Determines the highest available version number.
 * - Renders only the blocks from that latest version using `ContentAreaMapper`.
 * - Logs and returns `null` if an error occurs.
 *
 * @param locales - Raw locale string from route params. Normalized via `getValidLocale`.
 * @returns A Suspense-wrapped React node for the latest draft Start Page,
 *   or `null` if skipped (build mode) or an error occurs.
 *
 * @example
 * ```tsx
 * <DraftModeHomePage locales="en" />
 * ```
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
