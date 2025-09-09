import OnPageEdit from '@/app/components/draft/on-page-edit'
import VisualBuilderExperienceWrapper from '@/app/components/visual-builder/wrapper'
import { optimizely } from '@/lib/optimizely/fetch'
import { SafeVisualBuilderExperience } from '@/lib/optimizely/types/experience'
import { getValidLocale } from '@/lib/optimizely/utils/language'
import { checkDraftMode } from '@/lib/utils/draft-mode'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

/**
 * Disable ISR and force dynamic rendering for Visual Builder previews.
 */
export const revalidate = 0
export const dynamic = 'force-dynamic'

type DraftExperienceRouteParams = {
  key: string
  version: string
  locale?: string
}

/**
 * Visual Builder **experience** draft preview route.
 *
 * Fetches and renders a full-page Visual Builder Experience in Optimizely SaaS CMS.
 * Ensures Draft Mode is enabled, normalizes the locale for CMS queries, and falls back
 * to a 404 when the experience cannot be resolved.
 *
 * @param params - The dynamic route params wrapped in a Promise (Next.js App Router pattern).
 * @param params.key - The unique key for the Visual Builder Experience.
 * @param params.version - The draft version identifier (GUID-like) for the experience.
 * @param params.locale - Optional locale from the route, normalized to a supported value.
 *
 * @returns A React Suspense boundary containing `OnPageEdit` wiring and the rendered
 * Visual Builder layout, or a fallback UI while loading.
 *
 * @throws Will trigger Next.js `notFound()` (404) when:
 * - Draft Mode is disabled
 * - Required params are missing (`key`, `version`)
 * - The CMS returns no matching experience
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

  // Normalize locale for the CMS call
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
