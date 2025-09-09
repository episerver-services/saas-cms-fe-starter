import React from 'react'
import blocksMapperFactory from './block-factory'

describe('blocksMapperFactory', () => {
  type HeroProps = { title: string; children?: React.ReactNode }
  type PromoProps = { id: string }

  const Hero: React.FC<HeroProps> = (p) => React.createElement('hero-stub', p)
  const Promo: React.FC<PromoProps> = (p) =>
    React.createElement('promo-stub', p)

  const factory = blocksMapperFactory({
    HeroBlock: Hero,
    PromoBlock: Promo,
  })

  it('returns null for unknown type', () => {
    // @ts-expect-error: intentionally using an unmapped typename to test fallback
    const el = factory({ typeName: 'UnknownBlock', props: {} })
    expect(el).toBeNull()
  })

  it('creates an element of the mapped component', () => {
    const el = factory({ typeName: 'HeroBlock', props: { title: 'Welcome' } })
    expect(el).toBeTruthy()
    // React element: type is the actual component function we mapped
    expect(el!.type).toBe(Hero)
    expect(el!.props.title).toBe('Welcome')
  })

  it('forwards props (including children)', () => {
    const child = React.createElement('span', { role: 'note' }, 'child')
    const el = factory({
      typeName: 'HeroBlock',
      props: { title: 'Hi', children: child },
    })

    expect(el!.props.title).toBe('Hi')
    expect(el!.props.children).toBe(child)
  })

  it('works with another mapped component and its own prop shape', () => {
    const el = factory({ typeName: 'PromoBlock', props: { id: 'p-1' } })
    expect(el!.type).toBe(Promo)
    expect(el!.props.id).toBe('p-1')
  })
})
