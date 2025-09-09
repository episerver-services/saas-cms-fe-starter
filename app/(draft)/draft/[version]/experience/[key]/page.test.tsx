// --- Hoisted-safe mocks ---

jest.mock('@/app/components/draft/on-page-edit', () => {
  const Comp = (props: any) => ({ type: 'on-page-edit-stub', props })
  return { __esModule: true, default: Comp }
})

jest.mock('@/app/components/visual-builder/wrapper', () => {
  const Comp = (props: any) => ({ type: 'vb-wrapper-stub', props })
  return { __esModule: true, default: Comp }
})

jest.mock('@/lib/utils/draft-mode', () => ({
  checkDraftMode: jest.fn(async () => true),
}))

jest.mock('@/lib/optimizely/utils/language', () => ({
  getValidLocale: jest.fn((l?: string) => l?.toLowerCase?.() ?? l),
}))

jest.mock('@/lib/optimizely/fetch', () => ({
  optimizely: {
    VisualBuilder: jest.fn(),
  },
}))

// --- Imports (SUT & mocks) ---

import Page from './page'
import OnPageEdit from '@/app/components/draft/on-page-edit'
import VisualBuilderExperienceWrapper from '@/app/components/visual-builder/wrapper'
import { optimizely } from '@/lib/optimizely/fetch'
import { checkDraftMode } from '@/lib/utils/draft-mode'
import { getValidLocale } from '@/lib/optimizely/utils/language'

// Narrow the mock types
const vbMock = (optimizely as any).VisualBuilder as jest.Mock
const checkDraftModeMock = checkDraftMode as unknown as jest.Mock
const getValidLocaleMock = getValidLocale as unknown as jest.Mock

// --- Helpers ---

// Extract children from returned React element tree created by our stubs
const childrenOf = (el: any) =>
  el && el.props && Array.isArray(el.props.children)
    ? el.props.children
    : el?.props?.children
      ? [el.props.children]
      : []

// Build params promise like Next.js provides
const params = (key: string, locale?: string, version = 'v1') =>
  Promise.resolve({ key, locale, version })

describe('experience draft preview page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    checkDraftModeMock.mockResolvedValue(true)
    getValidLocaleMock.mockImplementation(
      (l?: string) => l?.toLowerCase?.() ?? l
    )
  })

  it('throws NEXT_HTTP_ERROR_FALLBACK;404 when draft mode is OFF', async () => {
    checkDraftModeMock.mockResolvedValue(false)

    await expect(
      Page({ params: params('exp-1', 'en', 'vX') } as any)
    ).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404')

    expect(vbMock).not.toHaveBeenCalled()
  })

  it('throws NEXT_HTTP_ERROR_FALLBACK;404 when key or version is missing', async () => {
    // Missing key
    await expect(
      Page({
        params: Promise.resolve({ key: '', version: 'v2', locale: 'en' }),
      } as any)
    ).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404')

    // Missing version
    await expect(
      Page({
        params: Promise.resolve({ key: 'abc', version: '', locale: 'en' }),
      } as any)
    ).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404')

    expect(vbMock).not.toHaveBeenCalled()
  })

  it('throws NEXT_HTTP_ERROR_FALLBACK;404 when experience is missing', async () => {
    vbMock.mockResolvedValue({ Experience: { item: undefined } })

    await expect(
      Page({ params: params('missing-exp', 'en', 'v2') } as any)
    ).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })

  it('returns Suspense element with OnPageEdit + VisualBuilder wrapper when experience exists', async () => {
    const fakeExperience = { id: 'exp-123', name: 'Test Experience' }
    vbMock.mockResolvedValue({ Experience: { item: fakeExperience } })

    const el: any = await Page({ params: params('abc123', 'EN', 'v3') } as any)

    // Top-level should be a Suspense element; inspect its children
    expect(el?.type).toBe((await import('react')).Suspense)
    const kids = childrenOf(el)

    // Two children: <OnPageEdit /> and <VisualBuilderExperienceWrapper />
    expect(kids.length).toBe(2)
    const onPage = kids[0]
    const wrapper = kids[1]

    // OnPageEdit: assert on actual component ref & props
    expect(onPage.type).toBe(OnPageEdit)
    expect(onPage.props.version).toBe('v3')
    expect(onPage.props.currentRoute).toBe('/en/draft/v3/experience/abc123') // locale normalized

    // Wrapper: assert on type and experience prop
    expect(wrapper.type).toBe(VisualBuilderExperienceWrapper)
    expect(wrapper.props.experience).toEqual(fakeExperience)

    // Ensure API called with normalized locale + preview flag
    expect(vbMock).toHaveBeenCalledWith(
      { key: 'abc123', version: 'v3', locales: ['en'] },
      { preview: true }
    )
  })

  it('falls back to default locale when locale is omitted', async () => {
    const fakeExperience = { id: 'exp-xyz', name: 'No-locale Experience' }
    vbMock.mockResolvedValue({ Experience: { item: fakeExperience } })

    const el: any = await Page({
      params: params('abc999', undefined, 'v5'),
    } as any)
    const kids = childrenOf(el)

    const onPage = kids[0]
    expect(onPage.type).toBe(OnPageEdit)
    expect(onPage.props.currentRoute).toBe('/en/draft/v5/experience/abc999')

    expect(vbMock).toHaveBeenCalledWith(
      { key: 'abc999', version: 'v5', locales: ['en'] },
      { preview: true }
    )
  })
})
