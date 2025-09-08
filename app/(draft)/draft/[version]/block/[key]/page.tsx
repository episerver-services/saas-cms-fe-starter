import ContentAreaMapper from '@/app/components/content-area/mapper'
import OnPageEdit from '@/app/components/draft/on-page-edit'
import { optimizely } from '@/lib/optimizely/fetch'
import { getValidLocale } from '@/lib/optimizely/utils/language'
import { checkDraftMode } from '@/lib/utils/draft-mode'
import { notFound } from 'next/navigation'

export const revalidate = 0
export const dynamic = 'force-dynamic'

/**
 * Renders a Visual Builder draft preview for a single CMS block or component.
 *
 * This route is triggered when previewing isolated components in Optimizely's Visual Builder.
 * It validates the draft mode, fetches the component by its key and version, and renders it.
 *
 * @param props - An async route object containing dynamic route parameters.
 * @param props.params - Route parameters:
 * - `key`: The unique identifier for the CMS component (block GUID or key).
 * - `locale`: The locale for the requested content (e.g. "en").
 * - `version`: The draft version identifier (GUID or version key).
 *
 * @returns A rendered block component in draft preview mode, or `notFound()` if unavailable.
 *
 * @example
 * /draft/7f42.../block/abcd1234 → renders block with key `abcd1234` from version `7f42...`
 */
export default async function Page({
  params,
}: {
  params: Promise<{ key: string; locale: string; version: string }>
}) {
  const isDraftModeEnabled = await checkDraftMode()
  if (!isDraftModeEnabled) {
    return notFound()
  }

  const { locale, version, key } = await params
  const locales = [getValidLocale(locale)]

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
        currentRoute={`/${locale}/draft/${version}/block/${key}`}
      />
      <ContentAreaMapper blocks={[component]} preview />
    </>
  )
}
