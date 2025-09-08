/** @jest-environment node */

import { GET } from './route'

// 1) Mock the module WITHOUT referencing enableMock yet
jest.mock('next/headers', () => ({
  draftMode: jest.fn(), // we'll configure its resolved value per-test
}))

// 2) Type-safe handle to the mocked fn
import { draftMode } from 'next/headers'
const draftModeMock = draftMode as unknown as jest.Mock

describe('GET /api/preview', () => {
  let enableMock: jest.Mock

  beforeEach(() => {
    enableMock = jest.fn()
    draftModeMock.mockResolvedValue({ enable: enableMock })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('returns 400 when url is missing', async () => {
    const req = new Request('http://localhost/api/preview') // no ?url=
    const res = await GET(req as any)

    expect(res.status).toBe(400)
    expect(await res.text()).toBe('Missing URL param')
    expect(enableMock).not.toHaveBeenCalled()
  })

  it('enables draft mode and redirects to the provided url (relative)', async () => {
    const req = new Request('http://localhost/api/preview?url=/some/page')
    const res = await GET(req as any)

    expect(res.status).toBe(307) // NextResponse.redirect default
    const loc = res.headers.get('location')!
    expect(loc).toBe('http://localhost/some/page')
    // or if you only care about the path:
    // expect(new URL(loc).pathname).toBe('/some/page')
    expect(enableMock).toHaveBeenCalledTimes(1)
  })

  it('works with absolute URLs too', async () => {
    const req = new Request(
      'http://localhost/api/preview?url=https://example.com/foo'
    )
    const res = await GET(req as any)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('https://example.com/foo')
    expect(enableMock).toHaveBeenCalledTimes(1)
  })
})
