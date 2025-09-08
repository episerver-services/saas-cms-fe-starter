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
  locale: string
  version: string
}

/**
 * Renders a draft preview page for a Visual Builder Experience.
 *
 * This route handles previewing full Experience layouts created in Visual Builder.
 * It ensures draft mode is active, fetches the requested experience, and renders it
 * using the VisualBuilderExperienceWrapper.
 *
 * @param props - The async route props object.
 * @param props.params - The route parameters:
 *   - `key`: The unique content key of the experience.
 *   - `locale`: The active locale.
 *   - `version`: The preview version of the experience.
 *
 * @returns A full Visual Builder experience page preview, or a 404 if not found.
 *
 * @example
 * /draft/9f8e.../experience/abcd1234 → renders preview of experience `abcd1234`
 */
export default async function Page({
  params,
}: {
  params: Promise<DraftExperienceRouteParams>
}) {
  const isDraftModeEnabled = await checkDraftMode()
  if (!isDraftModeEnabled) {
    return notFound()
  }

  const { locale, version, key } = await params
  const locales = [getValidLocale(locale)]

  const experienceData = await optimizely.VisualBuilder(
    { key, version, locales },
    { preview: true }
  )

  const experience = experienceData.Experience?.item as
    | SafeVisualBuilderExperience
    | undefined

  if (!experience) {
    return notFound()
  }

  return (
    <Suspense fallback={<div>Loading Visual Builder experience...</div>}>
      <OnPageEdit
        version={version}
        currentRoute={`/${locale}/draft/${version}/experience/${key}`}
      />
      <VisualBuilderExperienceWrapper experience={experience} />
    </Suspense>
  )
}
