import { draftMode } from 'next/headers'
import { optimizely } from '../fetch'

/**
 * Retrieves the StartPage content from Optimizely CMS.
 *
 * Switches between **draft (preview)** and **published** modes:
 * - **Draft Mode**: If `draftMode` is enabled *and* a `version` is provided, fetches that specific preview version.
 * - **Published Mode**: If draft mode is disabled *or* no `version` is supplied, fetches the published StartPage versions.
 *
 * This method supports local mocking when `NEXT_PUBLIC_MOCK_OPTIMIZELY=true` is set.
 *
 * @param params - Query parameters
 * @param params.locales - Locales to fetch (e.g., `['en']`).
 * @param params.version - Optional version identifier (required for draft/preview fetch).
 * @returns A Promise resolving to the StartPage content result.
 *
 * @example
 * // Draft mode + preview version
 * const preview = await getStartPageContent({ locales: ['en'], version: 'v1' });
 *
 * @example
 * // Published mode
 * const published = await getStartPageContent({ locales: ['en'] });
 */
export async function getStartPageContent({
  locales,
  version,
}: {
  locales: string[]
  version?: string
}) {
  const { isEnabled } = await draftMode()

  return isEnabled && version
    ? await optimizely.GetPreviewStartPage({ version, locales })
    : await optimizely.GetAllStartPageVersions({ locales })
}
