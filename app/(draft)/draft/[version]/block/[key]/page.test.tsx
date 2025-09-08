/** @jest-environment node */

// Mock modules first (hoisted safe)
jest.mock('@/app/components/content-area/mapper', () => {
  const Comp = (props: any) => ({
    type: 'mapper-stub',
    props,
  })
  return { __esModule: true, default: Comp }
})

jest.mock('@/app/components/draft/on-page-edit', () => {
  const Comp = (props: any) => ({
    type: 'on-page-edit-stub',
    props,
  })
  return { __esModule: true, default: Comp }
})

jest.mock('@/lib/utils/draft-mode', () => ({
  checkDraftMode: jest.fn(async () => true),
}))

jest.mock('@/lib/optimizely/utils/language', () => ({
  getValidLocale: jest.fn((l: string) => l?.toLowerCase?.() ?? l),
}))

jest.mock('@/lib/optimizely/fetch', () => ({
  optimizely: {
    GetComponentByKey: jest.fn(),
  },
}))

// Import SUT & mocked modules
import Page from './page'
import OnPageEdit from '@/app/components/draft/on-page-edit'
import Mapper from '@/app/components/content-area/mapper'
import { optimizely } from '@/lib/optimizely/fetch'
import { checkDraftMode } from '@/lib/utils/draft-mode'
import { getValidLocale } from '@/lib/optimizely/utils/language'

const getComponentByKeyMock = (optimizely as any).GetComponentByKey as jest.Mock
const checkDraftModeMock = checkDraftMode as unknown as jest.Mock
const getValidLocaleMock = getValidLocale as unknown as jest.Mock

// helper to get children from returned React element
const childrenOf = (el: any) =>
  el && el.props && Array.isArray(el.props.children)
    ? el.props.children
    : el?.props?.children
      ? [el.props.children]
      : []

const params = (key: string, locale = 'en', version = 'v1') =>
  Promise.resolve({ key, locale, version })

describe('block draft preview page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    checkDraftModeMock.mockResolvedValue(true)
    getValidLocaleMock.mockImplementation((l: string) => l?.toLowerCase?.())
  })

  it('throws NEXT_HTTP_ERROR_FALLBACK;404 when draft mode is OFF', async () => {
    checkDraftModeMock.mockResolvedValue(false)

    await expect(
      Page({ params: params('block-1', 'en', 'vX') } as any)
    ).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404')

    expect(getComponentByKeyMock).not.toHaveBeenCalled()
  })

  it('throws NEXT_HTTP_ERROR_FALLBACK;404 when component is missing', async () => {
    getComponentByKeyMock.mockResolvedValue({ _Component: { item: null } })

    await expect(
      Page({ params: params('missing', 'en', 'v2') } as any)
    ).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })

  it('returns element tree with OnPageEdit + Mapper when component exists (props verified)', async () => {
    getComponentByKeyMock.mockResolvedValue({
      _Component: { item: { id: 'cmp-1', type: 'SomeBlock' } },
    })

    const el: any = await Page({ params: params('abc123', 'EN', 'v3') } as any)
    const kids = childrenOf(el)

    // Expect two children: <OnPageEdit .../> and <ContentAreaMapper .../>
    expect(kids.length).toBe(2)

    const onPage = kids[0]
    const mapper = kids[1]

    // OnPageEdit: assert on type and props actually passed by Page
    expect(onPage.type).toBe(OnPageEdit)
    expect(onPage.props.version).toBe('v3')
    // NOTE: route is locale-less now
    expect(onPage.props.currentRoute).toBe('/draft/v3/block/abc123')

    // Mapper: assert on type and real props passed by Page
    expect(mapper.type).toBe(Mapper)
    expect(mapper.props.preview).toBe(true)
    expect(Array.isArray(mapper.props.blocks)).toBe(true)
    expect(mapper.props.blocks).toHaveLength(1)

    // Ensure query called with normalized locale (from 'EN' -> 'en')
    expect(getComponentByKeyMock).toHaveBeenCalledWith(
      { locales: ['en'], key: 'abc123', version: 'v3' },
      { preview: true }
    )
  })
})
