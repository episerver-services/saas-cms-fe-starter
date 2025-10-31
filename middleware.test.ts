import type { NextRequest } from 'next/server'

let middleware: (req: NextRequest) => Promise<Response>

beforeAll(async () => {
  process.env.OPTIMIZELY_PREVIEW_SECRET = 'secret-token'
  jest.resetModules()
  middleware = (await import('@/middleware')).middleware
})

jest.mock('@/lib/optimizely/utils/language', () => ({
  DEFAULT_LOCALE: 'en',
  LOCALES: ['en', 'fr', 'de'],
}))

jest.mock('@/lib/utils', () => ({
  createUrl: (path: string, params: URLSearchParams) =>
    path + (params.toString() ? '?' + params.toString() : ''),
  withLeadingSlash: (p: string) => (p.startsWith('/') ? p : '/' + p),
}))

jest.mock('negotiator', () => {
  return jest.fn().mockImplementation(() => ({
    languages: () => ['fr', 'en'],
  }))
})

interface MockRequestOptions {
  headers?: Record<string, string>
  cookieLocale?: string
}

describe('middleware', () => {
  const makeRequest = (
    url: string,
    opts: MockRequestOptions = {}
  ): NextRequest => {
    const { headers = {}, cookieLocale } = opts
    const request = {
      url,
      nextUrl: new URL(url),
      headers: new Headers(headers),
      cookies: {
        get: jest.fn((key: string) =>
          key === '__LOCALE_NAME' && cookieLocale
            ? { value: cookieLocale }
            : undefined
        ),
      },
    }
    return request as unknown as NextRequest
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 200 for excluded paths (API/static)', async () => {
    const req = makeRequest('https://example.com/api/test')
    const res = await middleware(req)
    expect(res.status).toBe(200)
  })

  it('returns 401 when preview token is missing or invalid', async () => {
    const req = makeRequest('https://example.com/preview/page')
    const res = await middleware(req)
    expect(res.status).toBe(401)
  })

  it('returns 200 when valid preview token is provided', async () => {
    const req = makeRequest(
      'https://example.com/preview/page?token=secret-token',
      { headers: { 'x-preview-token': 'secret-token' } }
    )
    const res = await middleware(req)
    expect(res.status).toBe(200)
  })

  it('sets locale header when path already contains locale', async () => {
    const req = makeRequest('https://example.com/fr/about')
    const res = await middleware(req)
    expect(res.headers.get('X-Locale')).toBe('fr')
  })

  it('either rewrites or redirects when path has no locale', async () => {
    const req = makeRequest('https://example.com/contact')
    const res = await middleware(req)
    expect([200, 307, 308]).toContain(res.status)
    expect(['en', 'fr', 'de']).toContain(res.headers.get('X-Locale'))
  })

  it('uses cookie locale when available', async () => {
    const req = makeRequest('https://example.com/', { cookieLocale: 'de' })
    const res = await middleware(req)
    expect(res.headers.get('X-Locale')).toBe('de')
  })

  it('falls back to browser language if no cookie', async () => {
    const req = makeRequest('https://example.com/', {
      headers: { 'accept-language': 'fr' },
    })
    const res = await middleware(req)
    expect(res.headers.get('X-Locale')).toBe('fr')
  })
})
