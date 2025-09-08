/** @jest-environment node */

import React from 'react'

// ---- Mocks (define first) ----
jest.mock('@/lib/utils/draft-mode', () => ({
  checkDraftMode: jest.fn(),
}))
jest.mock('@/lib/optimizely/fetch', () => ({
  optimizely: { GetPreviewStartPage: jest.fn() },
}))
// Keep simple element-returning stubs (no data-testid props)
jest.mock('@/app/components/content-area/mapper', () => {
  const stub = jest.fn((props: any) => React.createElement('div', props))
  return { __esModule: true, default: stub }
})
jest.mock('@/app/components/draft/on-page-edit', () => {
  const stub = jest.fn((props: any) => React.createElement('div', props))
  return { __esModule: true, default: stub }
})
jest.mock('@/app/components/errors/fallback-error-ui', () => {
  const stub = jest.fn((props: any) => React.createElement('div', props))
  return { __esModule: true, default: stub }
})
const notFoundMock = jest.fn(() => {
  const err = new Error('NEXT_NOT_FOUND')
  ;(err as any).digest = 'NEXT_NOT_FOUND'
  throw err
})
jest.mock('next/navigation', () => ({
  notFound: () => notFoundMock(),
}))

// ---- SUT ----
import CmsPage from './page'
import { checkDraftMode } from '@/lib/utils/draft-mode'
import { optimizely } from '@/lib/optimizely/fetch'

const checkDraftModeMock = checkDraftMode as unknown as jest.Mock
const getPreviewStartPageMock = (optimizely as any)
  .GetPreviewStartPage as jest.Mock

// helper to match the page’s params typing (Promise)
const params = (version: string, slug?: string) =>
  Promise.resolve({ version, slug })

describe('draft preview page (final behavior)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    delete process.env.MOCK_OPTIMIZELY // ensure OnPageEdit path would render
  })

  it('throws notFound() when draft mode is disabled', async () => {
    checkDraftModeMock.mockResolvedValue(false)

    await expect(
      CmsPage({ params: params('v1', 'about') } as any)
    ).rejects.toThrow('NEXT_NOT_FOUND')

    expect(notFoundMock).toHaveBeenCalledTimes(1)
    expect(getPreviewStartPageMock).not.toHaveBeenCalled()
  })

  it('returns fallback UI when CMS returns no (truthy) blocks', async () => {
    checkDraftModeMock.mockResolvedValue(true)
    getPreviewStartPageMock.mockResolvedValue({
      StartPage: { item: { blocks: [null, undefined, false] } },
    })

    const el = await CmsPage({ params: params('v2', 'any') } as any)
    const html = JSON.stringify(el)

    // Fallback present by its props
    expect(html).toContain('"title":"Failed to load draft content"')
    expect(html).toMatch(/"message":".*An error occurred/i)

    // Ensure mapper props aren’t present
    expect(html).not.toContain('"preview":true')
    expect(html).not.toContain('"blocks":')
  })

  it('renders OnPageEdit + Mapper when blocks exist and builds currentRoute correctly', async () => {
    checkDraftModeMock.mockResolvedValue(true)
    getPreviewStartPageMock.mockResolvedValue({
      StartPage: { item: { blocks: [{ id: 1 }, { id: 2 }] } },
    })

    const el = await CmsPage({ params: params('v3', 'en/about') } as any)
    const html = JSON.stringify(el)

    // OnPageEdit props present
    expect(html).toContain('"version":"v3"')
    expect(html).toContain('"currentRoute":"/draft/v3/en/about"')

    // Mapper present with blocks + preview
    expect(html).toContain('"preview":true')
    expect(html).toContain('{"id":1}')
    expect(html).toContain('{"id":2}')
  })

  it('uses empty slug -> currentRoute ends with a trailing slash', async () => {
    checkDraftModeMock.mockResolvedValue(true)
    getPreviewStartPageMock.mockResolvedValue({
      StartPage: { item: { blocks: [{ id: 1 }] } },
    })

    const el = await CmsPage({ params: params('v4') } as any)
    const html = JSON.stringify(el)

    expect(html).toContain('"currentRoute":"/draft/v4/"')
  })

  it('returns fallback UI on CMS error', async () => {
    checkDraftModeMock.mockResolvedValue(true)
    getPreviewStartPageMock.mockRejectedValue(new Error('boom'))

    const el = await CmsPage({ params: params('v5', 'x') } as any)
    const html = JSON.stringify(el)

    expect(html).toMatch(/"message":".*An error occurred/i)
    expect(html).toContain('"title":"Failed to load draft content"')
  })
})
