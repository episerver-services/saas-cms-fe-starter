jest.mock('../content-area/mapper', () => {
  // Keep this as a function component so React treats it like a real component.
  // We don't actually render; we just inspect the returned element tree.
  const Mapper = (props: any) => ({ type: 'mapper-stub', props })
  return { __esModule: true, default: Mapper }
})

jest.mock('@/lib/optimizely/fetch', () => ({
  optimizely: {
    GetAllStartPageVersions: jest.fn(),
  },
}))

jest.mock('@/lib/optimizely/utils/language', () => ({
  getValidLocale: jest.fn((l: string) => l?.toLowerCase?.() ?? l),
}))

import DraftModeHomePage from './draft-mode-homepage'
import Mapper from '../content-area/mapper'
import { optimizely } from '@/lib/optimizely/fetch'

const getAllStartPageVersionsMock = (optimizely as any)
  .GetAllStartPageVersions as jest.Mock

const ORIGINAL_ENV = { ...process.env }

// tiny helper to unwrap a single child returned by <Suspense>{child}</Suspense>
const onlyChild = (el: any) => {
  const kids = el?.props?.children
  if (!kids) return undefined
  return Array.isArray(kids) ? kids[0] : kids
}

describe('DraftModeHomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...ORIGINAL_ENV }
  })

  afterAll(() => {
    process.env = ORIGINAL_ENV
  })

  it('skips rendering during build (IS_BUILD=true) and returns null', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    process.env.IS_BUILD = 'true'

    const el = await DraftModeHomePage({ locales: 'EN' })
    expect(el).toBeNull()

    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('renders mapper with blocks from the latest version and filters falsey', async () => {
    // Two versions: v1 + v3 (v3 should win). Also include falsey blocks.
    getAllStartPageVersionsMock.mockResolvedValue({
      StartPage: {
        items: [
          {
            _metadata: { version: '1' },
            blocks: [{ __typename: 'Old', id: 'old' }, null, undefined],
          },
          {
            _metadata: { version: '3' },
            blocks: [null, { __typename: 'New', id: 'new' }],
          },
        ],
      },
    })

    const el: any = await DraftModeHomePage({ locales: 'EN' })
    const child = onlyChild(el) // mapper component returned under <Suspense/>

    // ✅ Expect the function identity of the mocked component
    expect(child?.type).toBe(Mapper)
    expect(Array.isArray(child.props.blocks)).toBe(true)
    // falsey filtered; only the 'new' block should remain
    expect(child.props.blocks).toHaveLength(1)
    expect(child.props.blocks[0].id).toBe('new')

    // locale normalization was applied
    expect(getAllStartPageVersionsMock).toHaveBeenCalledWith(
      { locales: ['en'] },
      { preview: true }
    )
  })

  it('handles empty items by rendering mapper with empty blocks', async () => {
    getAllStartPageVersionsMock.mockResolvedValue({
      StartPage: { items: [] },
    })

    const el: any = await DraftModeHomePage({ locales: 'en' })
    const child = onlyChild(el)

    // ✅ Expect the function identity of the mocked component
    expect(child?.type).toBe(Mapper)
    expect(Array.isArray(child.props.blocks)).toBe(true)
    expect(child.props.blocks).toHaveLength(0)
  })

  it('returns null on fetch error', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    getAllStartPageVersionsMock.mockRejectedValue(new Error('network'))

    const el = await DraftModeHomePage({ locales: 'en' })
    expect(el).toBeNull()

    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })
})
