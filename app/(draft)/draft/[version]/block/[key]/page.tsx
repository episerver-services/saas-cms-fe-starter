import ContentAreaMapper from '@/app/components/content-area/mapper'
import OnPageEdit from '@/app/components/draft/on-page-edit'
import { optimizely } from '@/lib/optimizely/fetch'
import { getValidLocale } from '@/lib/optimizely/utils/language'
import { checkDraftMode } from '@/lib/utils/draft-mode'
import { notFound } from 'next/navigation'

/**
 * Disable ISR and force dynamic rendering for Visual Builder previews.
 */
export const revalidate = 0
export const dynamic = 'force-dynamic'

/**
 * The default locale used for CMS fetches in single-locale deployments.
 * This normalizes any missing/oddly-cased locale from the route to a supported one.
 */
const DEFAULT_LOCALE = (process.env.SITE_DEFAULT_LOCALE || 'en').toLowerCase()

/**
 * Visual Builder **component** draft preview route.
 *
 * Renders an isolated CMS component (block) in Optimizely Visual Builder using the
 * supplied `version` and `key`. Draft Mode is required; otherwise the route 404s.
 * The URL is intentionally kept locale-less, while the CMS call is normalized to a valid locale.
 *
 * @param params - The dynamic route params wrapped in a Promise (Next.js App Router pattern).
 * @param params.version - The Visual Builder draft version identifier (GUID-like).
 * @param params.key - The component key for the block to render.
 * @param params.locale - Optional route locale; normalized to a supported locale for CMS queries.
 *
 * @returns A React fragment containing the edit wiring and the mapped component blocks.
 *
 * @throws Will trigger Next.js `notFound()` (404) when:
 * - Draft Mode is disabled
 * - Required params are missing (`version`, `key`)
 * - The component cannot be fetched for the given inputs
 */
export default async function Page({
  params,
}: {
  params: Promise<{ key: string; version: string; locale?: string }>
}) {
  if (!(await checkDraftMode())) return notFound()

  const { version, key, locale } = await params
  if (!version || !key) return notFound()

  // Normalize locale for the CMS call; keep URL locale-less for a single-locale site.
  const normalizedLocale = getValidLocale(
    (locale || DEFAULT_LOCALE).toLowerCase()
  )
  const locales = [normalizedLocale]

  const response = await optimizely.GetComponentByKey(
    { locales, key, version },
    { preview: true }
  )

  const component = response._Component?.item
  if (!component) return notFound()

  return (
    <>
      <OnPageEdit
        version={version}
        // Keep the route locale-less in a single-locale app
        currentRoute={`/draft/${version}/block/${key}`}
      />
      <ContentAreaMapper blocks={[component]} preview />
    </>
  )
}
