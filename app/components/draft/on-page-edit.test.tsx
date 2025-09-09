import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'

const mockPush = jest.fn()
const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    refresh: mockRefresh,
  })),
}))

import OnPageEdit from './on-page-edit'

const EVENT = 'optimizely:cms:contentSaved'

describe('OnPageEdit (contentSaved handler)', () => {
  let container: HTMLDivElement
  let root: Root | undefined

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(async () => {
    // Unmount inside React's act
    if (root) {
      await act(async () => {
        root!.unmount()
      })
      root = undefined
    }
    container.remove()
    jest.clearAllMocks()
  })

  it('subscribes and unsubscribes to the contentSaved event', async () => {
    const addSpy = jest.spyOn(window, 'addEventListener')
    const removeSpy = jest.spyOn(window, 'removeEventListener')

    await act(async () => {
      root = createRoot(container)
      root.render(
        <OnPageEdit version="123" currentRoute="/draft/123/en/page" />
      )
    })

    expect(addSpy).toHaveBeenCalledWith(EVENT, expect.any(Function))

    await act(async () => {
      root!.unmount()
    })

    expect(removeSpy).toHaveBeenCalledWith(EVENT, expect.any(Function))
  })

  it('refreshes when saved version matches current version', async () => {
    await act(async () => {
      root = createRoot(container)
      root.render(
        <OnPageEdit version="123" currentRoute="/draft/123/en/page" />
      )
    })

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(EVENT, {
          detail: {
            contentLink: 'guid_123',
            previewUrl: '/ignored',
            previewToken: 'tok',
          },
        } as any)
      )
    })

    expect(mockRefresh).toHaveBeenCalledTimes(1)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('pushes to updated route when a new version is saved', async () => {
    await act(async () => {
      root = createRoot(container)
      root.render(
        <OnPageEdit version="123" currentRoute="/draft/123/en/page" />
      )
    })

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(EVENT, {
          detail: {
            contentLink: 'guid_456',
            previewUrl: '/ignored',
            previewToken: 'tok',
          },
        } as any)
      )
    })

    expect(mockPush).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith('/draft/456/en/page')
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('refreshes when contentLink is malformed (no version suffix)', async () => {
    await act(async () => {
      root = createRoot(container)
      root.render(<OnPageEdit version="789" currentRoute="/draft/789" />)
    })

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(EVENT, {
          detail: {
            contentLink: 'invalid',
            previewUrl: '/ignored',
            previewToken: 'tok',
          },
        } as any)
      )
    })

    expect(mockRefresh).toHaveBeenCalledTimes(1)
    expect(mockPush).not.toHaveBeenCalled()
  })
})
