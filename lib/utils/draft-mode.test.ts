import { checkDraftMode } from './draft-mode'
import { draftMode } from 'next/headers'

jest.mock('next/headers', () => ({
  draftMode: jest.fn(),
}))
const mockDraftMode = draftMode as jest.MockedFunction<typeof draftMode>

const makeDraftMode = (isEnabled: boolean) => ({
  isEnabled,
  enable: jest.fn(async () => {}),
  disable: jest.fn(async () => {}),
})

describe('checkDraftMode', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV } // shallow copy
  })

  afterAll(() => {
    process.env = OLD_ENV // restore
  })

  const setNodeEnv = (val: string) => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: val,
      configurable: true,
    })
  }

  it('returns true if draftMode is enabled', async () => {
    mockDraftMode.mockResolvedValue(makeDraftMode(true))
    setNodeEnv('production')
    await expect(checkDraftMode()).resolves.toBe(true)
  })

  it('returns false if draftMode is disabled in production', async () => {
    mockDraftMode.mockResolvedValue(makeDraftMode(false))
    setNodeEnv('production')
    await expect(checkDraftMode()).resolves.toBe(false)
  })

  it('returns true in development even if draftMode is disabled', async () => {
    mockDraftMode.mockResolvedValue(makeDraftMode(false))
    setNodeEnv('development')
    await expect(checkDraftMode()).resolves.toBe(true)
  })

  it('returns true in development if draftMode is enabled', async () => {
    mockDraftMode.mockResolvedValue(makeDraftMode(true))
    setNodeEnv('development')
    await expect(checkDraftMode()).resolves.toBe(true)
  })
})
