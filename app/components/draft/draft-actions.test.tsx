import DraftActions from './draft-actions'
import CTAButton from '@/app/components/ui/cta-button'

// Mock next/navigation hooks used by the component
jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
  usePathname: () => '/draft/abc', // default for tests that don't inject pathname
}))

// helper to read children from the returned React element (without a renderer)
const childrenOf = (el: any) =>
  el && el.props && Array.isArray(el.props.children)
    ? el.props.children
    : el?.props?.children
      ? [el.props.children]
      : []

const ORIGINAL_ENV = { ...process.env }

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  jest.resetModules()
})

describe('DraftActions', () => {
  it('returns null when not in mock mode', async () => {
    process.env.NEXT_PUBLIC_MOCK_OPTIMIZELY = 'false'
    // Inject a draft pathname, but mock flag is false
    const el = await (DraftActions as any)({ pathname: '/draft/xyz' })
    expect(el).toBe(null)
  })

  it('returns null when not in /draft route', async () => {
    process.env.NEXT_PUBLIC_MOCK_OPTIMIZELY = 'true'
    const el = await (DraftActions as any)({ pathname: '/news/article' })
    expect(el).toBe(null)
  })

  it('renders two CTA buttons when mock + /draft route', async () => {
    process.env.NEXT_PUBLIC_MOCK_OPTIMIZELY = 'true'
    const el: any = await (DraftActions as any)({ pathname: '/draft/some' })
    const kids = childrenOf(el)

    expect(kids.length).toBe(2)
    // ✅ Expect the real component function, not a "cta" stub string
    expect(kids[0].type).toBe(CTAButton)
    expect(kids[1].type).toBe(CTAButton)

    // Ensure CTA props are wired
    expect(kids[0].props.textDesktop).toBe('Refresh Page')
    expect(typeof kids[0].props.onClick).toBe('function')
    expect(kids[1].props.textDesktop).toBe('Disable Draft')
    expect(typeof kids[1].props.onClick).toBe('function')
  })
})
