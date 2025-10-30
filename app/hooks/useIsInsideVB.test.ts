import { renderHook } from '@testing-library/react'
import { useIsInsideVB } from './useIsInsideVB'

describe('useIsInsideVB', () => {
  const originalReferrer = document.referrer
  const originalParent = window.parent
  const originalSelf = window.self

  beforeEach(() => {
    jest.restoreAllMocks()
    Object.defineProperty(document, 'referrer', {
      value: '',
      configurable: true,
    })
    Object.defineProperty(window, 'parent', {
      value: window,
      configurable: true,
    })
    Object.defineProperty(window, 'self', {
      value: window,
      configurable: true,
    })
  })

  afterAll(() => {
    Object.defineProperty(document, 'referrer', {
      value: originalReferrer,
      configurable: true,
    })
    Object.defineProperty(window, 'parent', {
      value: originalParent,
      configurable: true,
    })
    Object.defineProperty(window, 'self', {
      value: originalSelf,
      configurable: true,
    })
  })

  it('returns false when not in iframe and no Optimizely referrer', () => {
    const { result } = renderHook(() => useIsInsideVB())
    expect(result.current).toBe(false)
  })

  it('returns true when in an iframe and document.referrer contains optimizely.com', () => {
    Object.defineProperty(document, 'referrer', {
      value: 'https://app.optimizely.com/editor',
      configurable: true,
    })
    Object.defineProperty(window, 'self', {
      value: {} as Window,
      configurable: true,
    })
    const { result } = renderHook(() => useIsInsideVB())
    expect(result.current).toBe(true)
  })

  it('returns true when parent.location.host includes optimizely.com', () => {
    Object.defineProperty(window, 'self', {
      value: {} as Window,
      configurable: true,
    })
    Object.defineProperty(window, 'parent', {
      value: { location: { host: 'foo.optimizely.com' } },
      configurable: true,
    })
    const { result } = renderHook(() => useIsInsideVB())
    expect(result.current).toBe(true)
  })

  it('returns true when cross-origin access throws (fallback path)', () => {
    Object.defineProperty(window, 'self', {
      value: {} as Window,
      configurable: true,
    })
    // define throwing getter locally
    Object.defineProperty(window, 'parent', {
      get() {
        throw new Error('Cross-origin')
      },
      configurable: true,
    })

    const { result } = renderHook(() => useIsInsideVB())
    expect(result.current).toBe(true)

    // restore immediately so future tests aren't affected
    Object.defineProperty(window, 'parent', {
      value: originalParent,
      configurable: true,
    })
  })

  it('returns false when in iframe but referrer is not Optimizely', () => {
    Object.defineProperty(document, 'referrer', {
      value: 'https://example.com',
      configurable: true,
    })
    Object.defineProperty(window, 'self', {
      value: {} as Window,
      configurable: true,
    })
    const { result } = renderHook(() => useIsInsideVB())
    expect(result.current).toBe(false)
  })
})
