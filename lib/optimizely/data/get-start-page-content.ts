import { draftMode } from 'next/headers'
import { optimizely } from '../fetch'

/**
 * Retrieves the StartPage content from the Optimizely CMS.
 *
 * Automatically switches between draft (preview) and published versions
 * depending on whether Next.js Draft Mode is currently enabled.
 *
 * - If in draft mode AND a version is supplied, fetches the preview version.
 * - Otherwise, fetches the published version(s) of the StartPage content.
 *
 * This method supports local mocking when `MOCK_OPTIMIZELY=true` is set.
 *
 * @param params - The content query parameters
 * @param params.locales - List of requested locales (e.g., ['en'])
 * @param params.version - Optional preview version key (required in draft mode)
 * @returns A Promise resolving to the StartPage content result
 *
 * @example
 * ```ts
 * const content = await getStartPageContent({ locales: ['en'], version: 'v1' });
 * ```
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
