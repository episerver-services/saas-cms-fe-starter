import ContentAreaMapper from '@/app/components/content-area/mapper'
import OnPageEdit from '@/app/components/draft/on-page-edit'
import { optimizely } from '@/lib/optimizely/fetch'
import { getValidLocale } from '@/lib/optimizely/utils/language'
import { checkDraftMode } from '@/lib/utils/draft-mode'
import { notFound } from 'next/navigation'

export const revalidate = 0
export const dynamic = 'force-dynamic'

// Use one default locale for CMS queries in a single-locale site
const DEFAULT_LOCALE = (process.env.SITE_DEFAULT_LOCALE || 'en').toLowerCase()

/**
 * Renders a Visual Builder draft preview for a single CMS block or component.
 * Triggered when previewing isolated components in Optimizely's Visual Builder.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ key: string; version: string; locale?: string }>
}) {
  if (!(await checkDraftMode())) return notFound()

  const { version, key, locale } = await params
  if (!version || !key) return notFound()

  // Tolerate missing / oddly-cased locale for CMS calls (URL remains locale-less)
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
