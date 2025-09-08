/** @jest-environment node */

import { GET } from './route'

// Mock next/headers.draftMode
jest.mock('next/headers', () => ({
  draftMode: jest.fn(),
}))
import { draftMode } from 'next/headers'
const draftModeMock = draftMode as unknown as jest.Mock

describe('GET /api/exit-preview', () => {
  let disableMock: jest.Mock

  beforeEach(() => {
    disableMock = jest.fn()
    draftModeMock.mockResolvedValue({ disable: disableMock })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('disables draft mode and returns confirmation', async () => {
    const res = await GET()

    expect(disableMock).toHaveBeenCalledTimes(1)
    expect(res).toBeInstanceOf(Response)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('Draft mode is disabled')
  })
})
