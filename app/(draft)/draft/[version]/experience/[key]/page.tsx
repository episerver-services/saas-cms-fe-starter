import OnPageEdit from '@/app/components/draft/on-page-edit'
import VisualBuilderExperienceWrapper from '@/app/components/visual-builder/wrapper'
import { optimizely } from '@/lib/optimizely/fetch'
import { SafeVisualBuilderExperience } from '@/lib/optimizely/types/experience'
import { getValidLocale } from '@/lib/optimizely/utils/language'
import { checkDraftMode } from '@/lib/utils/draft-mode'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

export const revalidate = 0
export const dynamic = 'force-dynamic'

type DraftExperienceRouteParams = {
  key: string
  version: string
  locale?: string
}

/**
 * Draft preview page for a Visual Builder Experience.
 * – Validates draft mode
 * – Fetches the experience by key/version
 * – Normalizes (optional) locale
 */
export default async function Page({
  params,
}: {
  params: Promise<DraftExperienceRouteParams>
}) {
  const isDraftModeEnabled = await checkDraftMode()
  if (!isDraftModeEnabled) return notFound()

  const { key, version, locale } = await params
  if (!key || !version) return notFound()

  // Be tolerant of missing/odd-cased locale
  const normalizedLocale = getValidLocale(locale ?? 'en').toLowerCase()
  const locales = [normalizedLocale]

  const experienceData = await optimizely.VisualBuilder(
    { key, version, locales },
    { preview: true }
  )

  const experience = experienceData.Experience?.item as
    | SafeVisualBuilderExperience
    | undefined

  if (!experience) return notFound()

  return (
    <Suspense fallback={<div>Loading Visual Builder experience...</div>}>
      <OnPageEdit
        version={version}
        currentRoute={`/${normalizedLocale}/draft/${version}/experience/${key}`}
      />
      <VisualBuilderExperienceWrapper experience={experience} />
    </Suspense>
  )
}
