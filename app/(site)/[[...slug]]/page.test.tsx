// --- Hoisted-safe module mocks ---
jest.mock('@/app/components/content-area/mapper', () => {
  const Comp = (props: any) => ({ type: 'mapper-stub', props })
  return { __esModule: true, default: Comp }
})
jest.mock('@/app/components/errors/fallback-error-ui', () => {
  const Comp = (props: any) => ({ type: 'fallback-stub', props })
  return { __esModule: true, default: Comp }
})
jest.mock('@/lib/optimizely/fetch', () => ({
  optimizely: {
    getPageByURL: jest.fn(),
    AllPages: jest.fn(),
  },
}))
jest.mock('next/headers', () => ({
  draftMode: jest.fn(async () => ({ isEnabled: false })),
}))
jest.mock('@/lib/utils/routing', () => ({
  resolveSlugAndLocale: jest.fn((locale: string, slug?: string[]) => ({
    localeCode: (locale ?? 'en').toLowerCase(),
    formattedSlug: `/${(slug ?? []).join('/')}`,
  })),
}))
jest.mock('@/lib/utils/metadata', () => ({
  generateAlternates: jest.fn((_locale: string, slug: string) => ({
    canonical: `https://example.com${slug || '/'}`,
  })),
}))
jest.mock('@/lib/optimizely/utils/language', () => ({
  mapPathWithoutLocale: jest.fn((p: string) => p.replace(/^\/en(\/|$)/i, '/')),
}))

// --- Imports (SUT & mocks) ---
import CmsPage, { generateMetadata, generateStaticParams } from './page'
import Mapper from '@/app/components/content-area/mapper'
import FallbackErrorUI from '@/app/components/errors/fallback-error-ui'
import { optimizely } from '@/lib/optimizely/fetch'
import { draftMode } from 'next/headers'
import { resolveSlugAndLocale } from '@/lib/utils/routing'
import { generateAlternates } from '@/lib/utils/metadata'
import { mapPathWithoutLocale } from '@/lib/optimizely/utils/language'

// Types
const getPageByURLMock = (optimizely as any).getPageByURL as jest.Mock
const allPagesMock = (optimizely as any).AllPages as jest.Mock
const draftModeMock = draftMode as unknown as jest.Mock
const resolveMock = resolveSlugAndLocale as unknown as jest.Mock
const alternatesMock = generateAlternates as unknown as jest.Mock
const mapPathMock = mapPathWithoutLocale as unknown as jest.Mock

// helpers
const params = (locale = 'en', slug?: string[]) =>
  Promise.resolve({ locale, slug })

const childrenOf = (el: any) =>
  el && el.props && Array.isArray(el.props.children)
    ? el.props.children
    : el?.props?.children
      ? [el.props.children]
      : []

const withEnv = (
  overrides: Record<string, string>,
  fn: () => Promise<void>
) => {
  const prev: Record<string, string | undefined> = {}
  for (const k of Object.keys(overrides)) prev[k] = process.env[k]
  Object.assign(process.env, overrides)
  return fn().finally(() => {
    for (const k of Object.keys(overrides)) {
      if (prev[k] === undefined) delete process.env[k]
      else process.env[k] = prev[k] as string
    }
  })
}

// silence noisy console in tests (optional)
jest.spyOn(console, 'warn').mockImplementation(() => {})
jest.spyOn(console, 'log').mockImplementation(() => {})
jest.spyOn(console, 'error').mockImplementation(() => {})

describe('site [[...slug]] page: generateMetadata', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.IS_BUILD = 'false'
    process.env.MOCK_OPTIMIZELY = 'false'
    draftModeMock.mockResolvedValue({ isEnabled: false })
    resolveMock.mockImplementation((locale: string, slug?: string[]) => ({
      localeCode: (locale ?? 'en').toLowerCase(),
      formattedSlug: `/${(slug ?? []).join('/')}`,
    }))
    alternatesMock.mockImplementation((_l: string, s: string) => ({
      canonical: `https://example.com${s || '/'}`,
    }))
  })

  it('returns fallback metadata during IS_BUILD or MOCK_OPTIMIZELY', async () => {
    await withEnv({ IS_BUILD: 'true', MOCK_OPTIMIZELY: 'false' }, async () => {
      const meta = await generateMetadata({ params: params('en', ['about']) })
      expect(meta.title).toBe('Optimizely Page')
    })
  })

  it('fetches CMS metadata and returns composed result (draftMode controls preview)', async () => {
    draftModeMock.mockResolvedValue({ isEnabled: true })
    getPageByURLMock.mockResolvedValue({
      CMSPage: {
        item: {
          title: 'About Us',
          shortDescription: 'desc',
          keywords: 'k1,k2',
        },
      },
    })

    const meta = await generateMetadata({ params: params('EN', ['about']) })

    expect(resolveMock).toHaveBeenCalledWith('EN', ['about'])
    expect(getPageByURLMock).toHaveBeenCalledWith(
      { locales: ['en'], slug: '/about' },
      { preview: true }
    )
    // Implementation lowercases the locale before passing to alternates
    expect(alternatesMock).toHaveBeenCalledWith('en', '/about')
    expect(meta.title).toBe('About Us')
    expect(meta.description).toBe('desc')
    expect(meta.keywords).toBe('k1,k2')
    expect((meta.alternates as any)?.canonical).toBe(
      'https://example.com/about'
    )
  })

  it('falls back when item missing', async () => {
    getPageByURLMock.mockResolvedValue({ CMSPage: { item: null } })
    const meta = await generateMetadata({ params: params('en', ['x', 'y']) })
    expect(meta.title).toBe('Optimizely Page - x/y')
  })

  it('falls back when CMS throws', async () => {
    getPageByURLMock.mockRejectedValue(new Error('boom'))
    const meta = await generateMetadata({ params: params('en', ['x']) })
    expect(meta.title).toBe('Optimizely Page - x')
  })
})

describe('site [[...slug]] page: generateStaticParams', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Ensure short-circuit flags are OFF for these tests
    process.env.IS_BUILD = 'false'
    process.env.MOCK_OPTIMIZELY = 'false'
  })

  it('returns [] and does not call AllPages during IS_BUILD or MOCK_OPTIMIZELY', async () => {
    await withEnv({ IS_BUILD: 'true', MOCK_OPTIMIZELY: 'false' }, async () => {
      const res = await generateStaticParams()
      expect(res).toEqual([])
      expect(allPagesMock).not.toHaveBeenCalled()
    })
  })

  /**
   * TEMPORARILY SKIPPED:
   * Unskip this when the app is connected to the real Optimizely CMS
   * AND mock data is turned off. This test asserts that generateStaticParams
   * queries AllPages and maps/dedupes locale-stripped paths.
   */
  it.skip('maps, strips locale, and dedupes paths', async () => {
    mapPathMock.mockImplementation((p: string) => p.replace(/^\/en/i, ''))
    allPagesMock.mockResolvedValue({
      _Content: {
        items: [
          { _metadata: { url: { default: '/en/about' } } },
          { _metadata: { url: { default: '/en/about' } } }, // dup
          { _metadata: { url: { default: '/en/products/a' } } },
          { _metadata: { url: { default: '/contact' } } },
          { _metadata: { url: {} } }, // missing default -> ignored
          {}, // missing metadata -> ignored
        ],
      },
    })

    const res = await generateStaticParams()
    expect(res).toEqual(
      expect.arrayContaining([
        { slug: ['about'] },
        { slug: ['products', 'a'] },
        { slug: ['contact'] },
      ])
    )

    const stringified = res.map((r) => (r.slug ?? []).join('/'))
    expect(new Set(stringified).size).toBe(stringified.length)
  })

  it('returns [] on CMS error', async () => {
    allPagesMock.mockRejectedValue(new Error('ugh'))
    const res = await generateStaticParams()
    expect(res).toEqual([])
  })
})

describe('site [[...slug]] page: default export', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.IS_BUILD = 'false'
    process.env.MOCK_OPTIMIZELY = 'false'
  })

  it('renders Suspense → Mapper with filtered blocks when page is valid (has _metadata.modified)', async () => {
    getPageByURLMock.mockResolvedValue({
      CMSPage: {
        item: {
          title: 'Home',
          _metadata: { modified: '2024-01-01T00:00:00Z' },
          blocks: [{ id: 1 }, null, { id: 2 }],
        },
      },
    })

    const el: any = await CmsPage({ params: params('en', ['home']) } as any)
    expect(el.type).toBe((await import('react')).Suspense)

    const kids = childrenOf(el)
    const mapper = kids[0]
    expect(mapper.type).toBe(Mapper)
    expect(mapper.props.blocks).toEqual([{ id: 1 }, { id: 2 }])

    expect(getPageByURLMock).toHaveBeenCalledWith(
      { locales: ['en'], slug: '/home' },
      { preview: false }
    )
  })

  it('returns fallback UI when CMS call throws', async () => {
    getPageByURLMock.mockRejectedValue(new Error('network!'))
    const el: any = await CmsPage({ params: params('en', ['oops']) } as any)
    expect(el.type).toBe(FallbackErrorUI)
    expect(el.props.title).toBe('Failed to load content')
  })

  it('throws NEXT_HTTP_ERROR_FALLBACK;404 when page missing or lacks modified metadata', async () => {
    getPageByURLMock.mockResolvedValue({ CMSPage: { item: null } })
    await expect(
      CmsPage({ params: params('en', ['nf']) } as any)
    ).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404')

    getPageByURLMock.mockResolvedValue({
      CMSPage: { item: { title: 'T', _metadata: {} } },
    })
    await expect(
      CmsPage({ params: params('en', ['nf2']) } as any)
    ).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })
})
