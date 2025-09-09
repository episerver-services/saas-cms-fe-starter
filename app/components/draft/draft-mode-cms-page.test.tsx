jest.mock('@/lib/optimizely/fetch', () => ({
  optimizely: {
    GetAllPagesVersionByURL: jest.fn(),
    GetAllVisualBuilderVersionsBySlug: jest.fn(),
  },
}))

jest.mock('@/lib/optimizely/utils/language', () => ({
  getValidLocale: jest.fn((l: string) => l?.toLowerCase?.() ?? l),
}))

// Make notFound throw like it does in Next runtime
jest.mock('next/navigation', () => ({
  notFound: () => {
    const err = new Error('NEXT_HTTP_ERROR_FALLBACK;404')
    ;(err as any).digest = 'NEXT_HTTP_ERROR_FALLBACK;404'
    throw err
  },
}))

// Silence info noise from the SUT
jest.spyOn(console, 'info').mockImplementation(() => {})

import DraftModeCmsPage from './draft-mode-cms-page'
import { optimizely } from '@/lib/optimizely/fetch'
import { getValidLocale } from '@/lib/optimizely/utils/language'

// We’ll assert against the real components/types
import ContentAreaMapper from '../content-area/mapper'
import VisualBuilderExperienceWrapper from '../visual-builder/wrapper'

const getPagesMock = (optimizely as any).GetAllPagesVersionByURL as jest.Mock
const getVBMock = (optimizely as any)
  .GetAllVisualBuilderVersionsBySlug as jest.Mock
const getValidLocaleMock = getValidLocale as unknown as jest.Mock

// Helper: <Suspense>{child}</Suspense> — return that child
const onlyChild = (el: any) => {
  const c = el?.props?.children
  if (Array.isArray(c)) return c[0]
  return c
}

describe('DraftModeCmsPage (draft preview resolver)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getValidLocaleMock.mockImplementation((l: string) => l?.toLowerCase?.())
  })

  it('normalizes locale and queries CMS with preview=true', async () => {
    getPagesMock.mockResolvedValue({
      CMSPage: { item: { blocks: [], _metadata: { version: '1' } } },
    })

    await DraftModeCmsPage({ locales: 'EN', slug: '/about' })

    expect(getValidLocaleMock).toHaveBeenCalledWith('EN')
    expect(getPagesMock).toHaveBeenCalledWith(
      { locales: ['en'], slug: '/about' },
      { preview: true }
    )
  })

  it('returns ContentAreaMapper when a CMS draft exists and filters falsey blocks', async () => {
    getPagesMock.mockResolvedValue({
      CMSPage: {
        item: {
          blocks: [null, undefined, false, { __typename: 'Hero', title: 'X' }],
          _metadata: { version: '7' },
        },
      },
    })

    const el: any = await DraftModeCmsPage({ locales: 'en', slug: '/home' })
    const child = onlyChild(el) // the mapper wrapped by <Suspense/>

    // type is the real component function
    expect(child.type).toBe(ContentAreaMapper)
    // falsey filtered → only the real one remains
    expect(Array.isArray(child.props.blocks)).toBe(true)
    expect(child.props.blocks).toHaveLength(1)
    expect(child.props.blocks[0].__typename).toBe('Hero')
  })

  it('falls back to Visual Builder, picking latest version by _metadata.version', async () => {
    // No CMS result
    getPagesMock.mockResolvedValue({ CMSPage: { item: null } })

    getVBMock.mockResolvedValue({
      SEOExperience: {
        items: [
          { _metadata: { version: '2' }, layout: { id: 'old' } },
          null,
          { _metadata: { version: '5' }, layout: { id: 'new' } },
        ],
      },
    })

    const el: any = await DraftModeCmsPage({ locales: 'en', slug: '/exp' })
    const child = onlyChild(el) // the wrapper inside <Suspense/>

    expect(getVBMock).toHaveBeenCalledWith(
      { locales: ['en'], slug: '/exp' },
      { preview: true }
    )

    // type is the real component function
    expect(child.type).toBe(VisualBuilderExperienceWrapper)
    expect(child.props.experience?.layout?.id).toBe('new')
  })

  it('throws 404 when neither CMS nor Visual Builder has a draft', async () => {
    getPagesMock.mockResolvedValue({ CMSPage: { item: null } })
    getVBMock.mockResolvedValue({ SEOExperience: { items: [] } })

    await expect(
      DraftModeCmsPage({ locales: 'en', slug: '/missing' })
    ).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })
})
