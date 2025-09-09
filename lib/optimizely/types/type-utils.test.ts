import { castContent, type SafeContent } from './type-utils'

describe('castContent', () => {
  it('returns the object when __typename matches', () => {
    const item: SafeContent = {
      __typename: 'HeroBlock',
      id: '123',
      title: 'Hello',
    }
    const result = castContent<{
      __typename?: 'HeroBlock'
      id: string
      title: string
    }>(item, 'HeroBlock')
    expect(result).not.toBeNull()
    // same reference (no cloning)
    expect(result).toBe(item as any)
    expect(result!.id).toBe('123')
    expect(result!.title).toBe('Hello')
  })

  it('returns null when __typename does not match', () => {
    const item: SafeContent = { __typename: 'PromoBlock', id: 'p1' }
    const result = castContent<{ __typename?: 'HeroBlock'; id: string }>(
      item,
      'HeroBlock'
    )
    expect(result).toBeNull()
  })

  it('returns null when content is null or undefined', () => {
    expect(
      castContent<{ __typename?: 'Anything' }>(null, 'Anything')
    ).toBeNull()
    expect(
      castContent<{ __typename?: 'Anything' }>(undefined, 'Anything')
    ).toBeNull()
  })

  it('returns null when content has no __typename', () => {
    const item: SafeContent = { id: 'no-typename' } // __typename omitted
    const result = castContent<{ __typename?: 'HeroBlock'; id: string }>(
      item,
      'HeroBlock'
    )
    expect(result).toBeNull()
  })

  it('works with broader shapes and preserves extra fields', () => {
    const item: SafeContent = {
      __typename: 'TeaserBlock',
      id: 't1',
      extra: { nested: true },
    }
    const result = castContent<{
      __typename?: 'TeaserBlock'
      id: string
      extra: { nested: boolean }
    }>(item, 'TeaserBlock')

    expect(result).not.toBeNull()
    expect(result!.extra.nested).toBe(true)
  })
})
