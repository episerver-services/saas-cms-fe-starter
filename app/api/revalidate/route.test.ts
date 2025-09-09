import { POST } from './route'

// ---- Mocks ----
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}))
jest.mock('@/lib/optimizely/fetch', () => ({
  optimizely: { GetContentByGuid: jest.fn() },
}))

// Silence error logs from handleError during tests (and restore after)
const consoleErrorSpy = jest
  .spyOn(console, 'error')
  .mockImplementation(() => {})

import { revalidatePath, revalidateTag } from 'next/cache'
import { optimizely } from '@/lib/optimizely/fetch'

const revalidatePathMock = revalidatePath as unknown as jest.Mock
const revalidateTagMock = revalidateTag as unknown as jest.Mock
const getContentMock = (optimizely as any).GetContentByGuid as jest.Mock

afterAll(() => {
  consoleErrorSpy.mockRestore()
})

// Helper: build a Request with secret + JSON body
function makeReq(
  body: unknown,
  secret = process.env.OPTIMIZELY_REVALIDATE_SECRET!
) {
  const url = `http://localhost/api/revalidate?cg_webhook_secret=${encodeURIComponent(
    secret ?? ''
  )}`
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/revalidate (Optimizely webhook)', () => {
  const SECRET = 'super-secret'
  const START = 'https://cms.example.com/site/en'

  beforeAll(() => {
    process.env.OPTIMIZELY_REVALIDATE_SECRET = SECRET
    process.env.OPTIMIZELY_START_PAGE_URL = START
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // 1) Invalid / missing secret -> 401
  it('rejects invalid secret', async () => {
    const req = makeReq({ data: { docId: 'abc_en_Published' } }, 'wrong')
    const res = await POST(req as any)
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ message: 'Invalid credentials' })
    expect(revalidatePathMock).not.toHaveBeenCalled()
    expect(revalidateTagMock).not.toHaveBeenCalled()
  })

  // 2) No action if docId missing or not "Published"
  it('returns no-op when docId missing', async () => {
    const req = makeReq({ data: {} })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ message: 'No action taken' })
  })

  it('returns no-op when docId is not a Published event', async () => {
    const req = makeReq({ data: { docId: 'abc_en_DraftSaved' } })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ message: 'No action taken' })
  })

  // 3) Content not found -> 500
  it('returns 500 when content not found', async () => {
    getContentMock.mockResolvedValue({ _Content: { items: [] } })
    const req = makeReq({
      data: { docId: '11111111-1111-1111-1111-111111111111_en_Published' },
    })
    const res = await POST(req as any)
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ message: 'Content not found' })
  })

  // 4) URL metadata missing -> 400
  it('returns 400 when URL metadata is missing', async () => {
    getContentMock.mockResolvedValue({
      _Content: { items: [{ _metadata: {} }] },
    })
    const req = makeReq({
      data: { docId: '22222222-2222-2222-2222-222222222222_en_Published' },
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ message: 'Page Not Found' })
  })

  // 5) SIMPLE url -> revalidatePath(/:locale/:path) with normalized path (no trailing slash)
  it('revalidates path for SIMPLE url metadata', async () => {
    getContentMock.mockResolvedValue({
      _Content: {
        items: [
          { _metadata: { url: { type: 'SIMPLE', default: '/news/article/' } } },
        ],
      },
    })
    const req = makeReq({
      data: { docId: '33333333-3333-3333-3333-333333333333_en_Published' },
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.revalidated).toBe(true)
    expect(revalidatePathMock).toHaveBeenCalledWith('/en/news/article')
    expect(revalidateTagMock).not.toHaveBeenCalled()
  })

  // 6) HIERARCHICAL url -> strip START_PAGE_URL and revalidate path
  it('revalidates path for HIERARCHICAL url metadata (strips start page)', async () => {
    getContentMock.mockResolvedValue({
      _Content: {
        items: [
          {
            _metadata: {
              url: {
                type: 'HIERARCHICAL',
                hierarchical: `${START}/about/team/`,
              },
            },
          },
        ],
      },
    })
    const req = makeReq({
      data: { docId: '44444444-4444-4444-4444-444444444444_en_Published' },
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    expect(revalidatePathMock).toHaveBeenCalledWith('/en/about/team')
  })

  // 7) Footer tag route -> revalidateTag('optimizely-footer')
  it('revalidates footer tag when URL contains "footer"', async () => {
    getContentMock.mockResolvedValue({
      _Content: {
        items: [
          {
            _metadata: { url: { type: 'SIMPLE', default: '/footer/settings' } },
          },
        ],
      },
    })
    const req = makeReq({
      data: { docId: '55555555-5555-5555-5555-555555555555_en_Published' },
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    expect(revalidateTagMock).toHaveBeenCalledWith('optimizely-footer')
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })

  // 8) Header tag route -> revalidateTag('optimizely-header')
  it('revalidates header tag when URL contains "header"', async () => {
    getContentMock.mockResolvedValue({
      _Content: {
        items: [
          { _metadata: { url: { type: 'SIMPLE', default: '/header/nav' } } },
        ],
      },
    })
    const req = makeReq({
      data: { docId: '66666666-6666-6666-6666-666666666666_en_Published' },
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    expect(revalidateTagMock).toHaveBeenCalledWith('optimizely-header')
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })

  // 9) Already-localized URL should not double-prefix the locale
  it('does not double-prefix locale when URL already starts with locale', async () => {
    getContentMock.mockResolvedValue({
      _Content: {
        items: [
          { _metadata: { url: { type: 'SIMPLE', default: '/en/already/' } } },
        ],
      },
    })
    const req = makeReq({
      data: { docId: '77777777-7777-7777-7777-777777777777_en_Published' },
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    expect(revalidatePathMock).toHaveBeenCalledWith('/en/already')
  })
})
