/** @jest-environment node */

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
  // Only the piece we use in generateMetadata
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
  mapPathWithoutLocale: jest.fn((p: string) =>
    // naive: strip leading "/en" or "/EN"
    p.replace(/^\/en(\/|$)/i, '/')
  ),
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

// silence noisy console in tests (optional)
jest.spyOn(console, 'warn').mockImplementation(() => {})
jest.spyOn(console, 'log').mockImplementation(() => {})
jest.spyOn(console, 'error').mockImplementation(() => {})

describe('site [[...slug]] page: generateMetadata', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
    const oldBuild = process.env.IS_BUILD
    const oldMock = process.env.MOCK_OPTIMIZELY
    process.env.IS_BUILD = 'true'
    process.env.MOCK_OPTIMIZELY = 'false'

    const meta = await generateMetadata({ params: params('en', ['about']) })
    expect(meta.title).toBe('Optimizely Page')

    process.env.IS_BUILD = oldBuild
    process.env.MOCK_OPTIMIZELY = oldMock
  })

  it('fetches CMS metadata (published vs draft controlled by draftMode) and returns composed result', async () => {
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
    expect(alternatesMock).toHaveBeenCalledWith('EN', '/about') // called with original locale param
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
  })

  it('returns [] during IS_BUILD or MOCK_OPTIMIZELY', async () => {
    const oldBuild = process.env.IS_BUILD
    const oldMock = process.env.MOCK_OPTIMIZELY
    process.env.IS_BUILD = 'true'
    process.env.MOCK_OPTIMIZELY = 'false'

    const res = await generateStaticParams()
    expect(res).toEqual([])

    process.env.IS_BUILD = oldBuild
    process.env.MOCK_OPTIMIZELY = oldMock
  })

  it('maps, strips locale, and dedupes paths', async () => {
    mapPathMock.mockImplementation((p: string) => p.replace(/^\/en/i, '')) // ensure strip
    allPagesMock.mockResolvedValue({
      _Content: {
        items: [
          { _metadata: { url: { default: '/en/about' } } },
          { _metadata: { url: { default: '/en/about' } } }, // dup
          { _metadata: { url: { default: '/en/products/a' } } },
          { _metadata: { url: { default: '/contact' } } },
        ],
      },
    })

    const res = await generateStaticParams()
    // Expect slugs arrays without leading empty segments
    expect(res).toEqual(
      expect.arrayContaining([
        { slug: ['about'] },
        { slug: ['products', 'a'] },
        { slug: ['contact'] },
      ])
    )
    // ensure no duplicates
    const stringified = res.map((r) => r.slug.join('/'))
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
    // top-level Suspense
    expect(el.type).toBe((await import('react')).Suspense)
    const kids = childrenOf(el)
    // child[0] is our mapper stub
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
    // case 1: no item
    getPageByURLMock.mockResolvedValue({ CMSPage: { item: null } })
    await expect(
      CmsPage({ params: params('en', ['nf']) } as any)
    ).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404')

    // case 2: item without _metadata.modified
    getPageByURLMock.mockResolvedValue({
      CMSPage: { item: { title: 'T', _metadata: {} } },
    })
    await expect(
      CmsPage({ params: params('en', ['nf2']) } as any)
    ).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })
})
