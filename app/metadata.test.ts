/** @jest-environment node */

const ORIGINAL_ENV = { ...process.env }

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  jest.resetModules()
})

describe('default site metadata', () => {
  it('uses SITE_DOMAIN from env in openGraph.url', async () => {
    process.env.SITE_DOMAIN = 'https://example.com'
    const { metadata } = await import('./metadata')

    expect(metadata.title).toBe('My Site – Modern CMS-Powered Experience')
    expect(metadata.description).toBe(
      'A flexible, high-performance site powered by a modern CMS and built with cutting-edge frontend technologies.'
    )

    // --- Open Graph ---
    expect(metadata.openGraph?.url).toBe('https://example.com')
    expect(metadata.openGraph?.title).toBe(
      'My Site – Modern CMS-Powered Experience'
    )
    expect(metadata.openGraph?.description).toBe(
      'A flexible, high-performance site powered by a modern CMS and built with cutting-edge frontend technologies.'
    )
    expect(metadata.openGraph?.siteName).toBe('My Site')
    expect(metadata.openGraph?.locale).toBe('en_US')

    // --- Twitter ---
    expect(metadata.twitter?.title).toBe(
      'My Site – Modern CMS-Powered Experience'
    )
    expect(metadata.twitter?.description).toBe(
      'A flexible, high-performance site powered by a modern CMS and built with cutting-edge frontend technologies.'
    )
    expect(metadata.twitter?.images).toContain(
      'https://example.com/og-image.jpg'
    )
  })

  it('falls back to localhost when SITE_DOMAIN is not set', async () => {
    delete process.env.SITE_DOMAIN
    const { metadata } = await import('./metadata')
    expect(metadata.openGraph?.url).toBe('http://localhost:3000')
    expect(metadata.twitter?.images).toContain(
      'http://localhost:3000/og-image.jpg'
    )
  })
})
