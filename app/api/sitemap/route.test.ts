/** @jest-environment node */

import { GET } from './route'

jest.mock('@/lib/optimizely/fetch', () => ({
  optimizely: { AllPages: jest.fn() },
}))

// If mapPathWithoutLocale does more than trimming a locale prefix,
// we keep it real. If you prefer to isolate, you can mock it to a pass-through.
import { optimizely } from '@/lib/optimizely/fetch'

const allPagesMock = (optimizely as any).AllPages as jest.Mock

describe('sitemap route', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV, SITE_DOMAIN: 'https://example.com' }
    allPagesMock.mockReset()
  })

  afterAll(() => {
    process.env = ORIGINAL_ENV
  })

  it('returns a well-formed sitemap with URLs from CMS (deduped & sorted)', async () => {
    allPagesMock.mockResolvedValue({
      _Content: {
        items: [
          { _metadata: { url: { default: '/en/about' } } },
          { _metadata: { url: { default: '/about' } } }, // duplicate after locale strip
          { _metadata: { url: { default: '/en/blog/z' } } },
          { _metadata: { url: { default: '/en/blog/a' } } },
        ],
      },
    })

    const res = await GET()
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/application\/xml/i)

    const body = await res.text()
    // Deduped and sorted: /about, /blog/a, /blog/z
    expect(body).toContain('<loc>https://example.com/about</loc>')
    expect(body).toContain('<loc>https://example.com/blog/a</loc>')
    expect(body).toContain('<loc>https://example.com/blog/z</loc>')

    // Ensure no duplicates of /about
    expect(body.match(/https:\/\/example\.com\/about/g)?.length).toBe(1)
  })

  it('ensures leading slashes and handles trailing slash on SITE_DOMAIN', async () => {
    process.env.SITE_DOMAIN = 'https://example.com/' // trailing slash
    allPagesMock.mockResolvedValue({
      _Content: {
        items: [
          { _metadata: { url: { default: 'contact' } } }, // no leading slash
          { _metadata: { url: { default: '/pricing/' } } }, // trailing slash on path
        ],
      },
    })

    const res = await GET()
    const body = await res.text()

    // Leading slash ensured, domain trailing slash stripped
    expect(body).toContain('<loc>https://example.com/contact</loc>')
    expect(body).toContain('<loc>https://example.com/pricing</loc>')
  })

  it('returns an empty sitemap when CMS call throws', async () => {
    allPagesMock.mockRejectedValue(new Error('CMS down'))

    const res = await GET()
    expect(res.status).toBe(200)

    const body = await res.text()
    // Valid but empty urlset
    expect(body).toMatch(
      /^<\?xml version="1\.0" encoding="UTF-8"\?>\s*<urlset[\s\S]*<\/urlset>$/i
    )
    // No <loc> entries present
    expect(body).not.toMatch(/<loc>/)
  })

  it('returns 500 if SITE_DOMAIN is missing', async () => {
    delete process.env.SITE_DOMAIN
    allPagesMock.mockResolvedValue({ _Content: { items: [] } })

    const res = await GET()
    expect(res.status).toBe(500)
    expect(await res.text()).toContain('Missing SITE_DOMAIN')
    expect(res.headers.get('content-type')).toMatch(/application\/xml/i)
  })
})
