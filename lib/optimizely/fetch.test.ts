/**
 * @file lib/optimizely/fetch.test.ts
 *
 * NOTE:
 * - We deliberately avoid branches that return local mocks (e.g. MOCK_OPTIMIZELY),
 *   and focus on production behaviors.
 */

import { optimizelyFetch } from './fetch'
import { optimizely as sdk } from './fetch'
import * as TypeGuards from '../type-guards'

jest.mock('next/headers', () => ({ draftMode: jest.fn() }))
jest.mock('../type-guards', () => ({
  isVercelError: jest.fn(),
}))

const isVercelErrorMock =
  TypeGuards.isVercelError as unknown as jest.MockedFunction<
    typeof TypeGuards.isVercelError
  >

import { draftMode } from 'next/headers'

const ORIGINAL_ENV = process.env

function setEnv(vars: Partial<NodeJS.ProcessEnv>) {
  process.env = { ...ORIGINAL_ENV, ...vars }
}
function resetEnv() {
  process.env = ORIGINAL_ENV
}

describe('optimizelyFetch (production behaviors)', () => {
  const query = 'query Test { ping }'
  const variables = { a: 1 }

  beforeEach(() => {
    jest.resetAllMocks()
    setEnv({
      NODE_ENV: 'production',
      IS_BUILD: 'false',
      MOCK_OPTIMIZELY: 'false',
      OPTIMIZELY_API_URL: 'https://api.optimizely.test/graphql',
      OPTIMIZELY_SINGLE_KEY: 'key123',
      OPTIMIZELY_PREVIEW_SECRET: 'basic-secret',
    })
    global.fetch = jest.fn()
  })

  afterEach(() => {
    resetEnv()
  })

  it('builds correct endpoint and POST body; includes default headers', async () => {
    const headers = new Headers({ 'x-test': '1' })
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ data: { ok: true }, errors: [] }),
      headers,
    })

    const res = await optimizelyFetch<{ ok: boolean }, typeof variables>({
      query,
      variables,
      cache: 'force-cache',
    })

    expect(global.fetch).toHaveBeenCalledTimes(1)
    const [endpoint, init] = (global.fetch as jest.Mock).mock.calls[0]

    expect(endpoint).toBe('https://api.optimizely.test/graphql?auth=key123')

    // method, headers and body
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual(
      expect.objectContaining({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      })
    )
    expect(JSON.parse(init.body)).toEqual({ query, variables })
    // default cache
    expect(init.cache).toBe('force-cache')
    // next tags
    expect(init.next).toEqual({ tags: ['optimizely-content'] })

    // returned shape
    expect(res.data.ok).toBe(true)
    expect(res.errors).toEqual([])
    expect(res.headers).toBe(headers)
  })

  it('merges custom headers and cacheTag into request', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ data: { ok: true }, errors: [] }),
      headers: new Headers(),
    })

    await optimizelyFetch({
      query,
      headers: { 'X-Custom': 'abc' },
      cacheTag: 'page-42',
    })

    const [, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(init.headers).toEqual(expect.objectContaining({ 'X-Custom': 'abc' }))
    expect(init.next).toEqual({
      tags: ['optimizely-content', 'page-42'],
    })
  })

  it('preview=true sets Basic auth and forces no-store cache', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ data: { ok: true }, errors: [] }),
      headers: new Headers(),
    })

    await optimizelyFetch({
      query,
      preview: true,
    })

    const [, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(init.headers.Authorization).toBe('Basic basic-secret')
    expect(init.cache).toBe('no-store')
  })

  it('throws if OPTIMIZELY_API_URL or OPTIMIZELY_SINGLE_KEY missing', async () => {
    setEnv({
      OPTIMIZELY_API_URL: '',
      OPTIMIZELY_SINGLE_KEY: '',
    })

    await expect(optimizelyFetch({ query })).rejects.toThrow(
      'Missing OPTIMIZELY_API_URL or OPTIMIZELY_SINGLE_KEY'
    )
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns empty data and skips fetch when IS_BUILD=true', async () => {
    setEnv({ IS_BUILD: 'true' })

    const res = await optimizelyFetch<{ any: string }>({ query })
    expect(global.fetch).not.toHaveBeenCalled()
    expect(res.data).toEqual({})
    expect(res.errors).toEqual([])
    expect(res.headers).toBeInstanceOf(Headers)
  })

  it('wraps thrown Vercel error shape with status/message/query', async () => {
    isVercelErrorMock.mockReturnValue(true)
    const err = { status: 503, message: 'upstream', other: 1 }
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(err)

    await expect(optimizelyFetch({ query })).rejects.toEqual({
      status: 503,
      message: 'upstream',
      query,
    })
  })

  it('wraps unknown thrown error with { error, query }', async () => {
    isVercelErrorMock.mockReturnValue(false)
    const err = new Error('boom')
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(err)

    await expect(optimizelyFetch({ query })).rejects.toEqual({
      error: err,
      query,
    })
  })
})

describe('requester (auto preview via draftMode)', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    setEnv({
      NODE_ENV: 'production',
      IS_BUILD: 'false',
      MOCK_OPTIMIZELY: 'false',
      OPTIMIZELY_API_URL: 'https://api.optimizely.test/graphql',
      OPTIMIZELY_SINGLE_KEY: 'key123',
      OPTIMIZELY_PREVIEW_SECRET: 'basic-secret',
    })
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ data: { pong: true }, errors: [] }),
      headers: new Headers(),
    })
  })
  afterEach(() => resetEnv())

  it('uses draftMode().isEnabled to set preview by default', async () => {
    ;(draftMode as jest.Mock).mockResolvedValue({ isEnabled: true })

    // Call one of the SDK functions that routes through requester
    await sdk.GetAllStartPageVersions({ locales: ['en'] })

    const [, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(init.headers.Authorization).toBe('Basic basic-secret')
    expect(init.cache).toBe('no-store')
  })

  it('respects explicit preview=false even if draftMode is true', async () => {
    ;(draftMode as jest.Mock).mockResolvedValue({ isEnabled: true })

    await sdk.GetAllStartPageVersions({ locales: ['en'] }, { preview: false })

    const [, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(init.headers.Authorization).toBeUndefined()
    expect(init.cache).toBe('force-cache')
  })
})
