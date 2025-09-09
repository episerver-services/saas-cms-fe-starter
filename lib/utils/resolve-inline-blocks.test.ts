import { resolveInlineBlocks } from './resolve-inline-blocks'
import { optimizely } from '../optimizely/fetch'
import type { SafeContent as IContent } from '../optimizely/types/type-utils'

jest.mock('../optimizely/fetch', () => ({
  optimizely: {
    GetContentByGuid: jest.fn(),
  },
}))

const mockedGetContentByGuid = optimizely.GetContentByGuid as jest.Mock

describe('resolveInlineBlocks', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('returns empty array if input is empty', async () => {
    const result = await resolveInlineBlocks([])
    expect(result).toEqual([])
    expect(mockedGetContentByGuid).not.toHaveBeenCalled()
  })

  it('returns blocks that are already resolved (non-stubs)', async () => {
    const block: IContent = { __typename: 'HeroBlock', title: 'Welcome' }
    const result = await resolveInlineBlocks([block])
    expect(result).toEqual([block])
    expect(mockedGetContentByGuid).not.toHaveBeenCalled()
  })

  it('fetches and resolves stub blocks by metadata key', async () => {
    const stub: IContent = {
      __typename: 'HeroBlock',
      _metadata: { key: 'guid-123' },
    }
    const fetched: IContent = { __typename: 'HeroBlock', title: 'Fetched hero' }

    mockedGetContentByGuid.mockResolvedValueOnce({
      _Content: { items: [fetched] },
    })

    const result = await resolveInlineBlocks([stub])
    expect(mockedGetContentByGuid).toHaveBeenCalledWith({ guid: 'guid-123' })
    expect(result).toEqual([fetched])
  })

  it('merges resolved and fetched blocks in the result', async () => {
    const nonStub: IContent = { __typename: 'TextBlock', text: 'inline text' }
    const stub: IContent = {
      __typename: 'HeroBlock',
      _metadata: { key: 'guid-456' },
    }
    const fetched: IContent = {
      __typename: 'HeroBlock',
      title: 'Fetched hero 2',
    }

    mockedGetContentByGuid.mockResolvedValueOnce({
      _Content: { items: [fetched] },
    })

    const result = await resolveInlineBlocks([nonStub, stub])
    expect(result).toEqual([nonStub, fetched])
  })

  it('ignores stubs if fetch returns no items', async () => {
    const stub: IContent = {
      __typename: 'MissingBlock',
      _metadata: { key: 'guid-789' },
    }
    mockedGetContentByGuid.mockResolvedValueOnce({ _Content: { items: [] } })

    const result = await resolveInlineBlocks([stub])
    expect(result).toEqual([]) // nothing resolved
  })

  it('skips null/undefined blocks', async () => {
    const block: IContent = { __typename: 'HeroBlock', title: 'valid' }
    const result = await resolveInlineBlocks([null, undefined, block])
    expect(result).toEqual([block])
  })
})
