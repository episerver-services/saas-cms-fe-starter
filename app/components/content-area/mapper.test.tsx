// Mock Block so we can assert props are forwarded
jest.mock('./block', () => {
  const Block = (props: any) => ({ type: 'Block', props })
  return { __esModule: true, default: Block }
})

import ContentAreaMapper from './mapper'
import Block from './block'

// Helper to unwrap children (handles fragments)
const childrenOf = (el: any) =>
  el && el.props && Array.isArray(el.props.children)
    ? el.props.children
    : el?.props?.children
      ? [el.props.children]
      : []

describe('ContentAreaMapper (CMS mode)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns null for empty or missing blocks', () => {
    expect(ContentAreaMapper({ blocks: undefined as any })).toBe(null)
    expect(ContentAreaMapper({ blocks: null as any })).toBe(null)
    expect(ContentAreaMapper({ blocks: [] })).toBe(null)
  })

  it('renders a Block for each block and forwards props (preview, isFirst)', () => {
    const blocks = [
      { __typename: 'Hero', id: 'a', title: 'Welcome' },
      { __typename: 'Teaser', id: 'b', body: 'Hello' },
    ] as any

    const el: any = ContentAreaMapper({
      blocks,
      preview: true,
      isVisualBuilder: false,
    })

    const wrappers = childrenOf(el)
    expect(wrappers.length).toBe(2)

    const firstKids = childrenOf(wrappers[0])
    const secondKids = childrenOf(wrappers[1])

    const firstBlock = firstKids[0]
    const secondBlock = secondKids[0]

    expect(firstBlock.type).toBe(Block)
    expect(firstBlock.props.typeName).toBe('Hero')
    expect(firstBlock.props.props).toMatchObject({
      id: 'a',
      title: 'Welcome',
      preview: true,
      isFirst: true,
    })

    expect(secondBlock.type).toBe(Block)
    expect(secondBlock.props.typeName).toBe('Teaser')
    expect(secondBlock.props.props).toMatchObject({
      id: 'b',
      body: 'Hello',
      preview: true,
      isFirst: false,
    })
  })

  it('recursively renders nested slots found in block props', () => {
    const blocks = [
      {
        __typename: 'Container',
        id: 'c1',
        mainArea: {
          items: [
            { __typename: 'Teaser', id: 't1' },
            { __typename: 'Teaser', id: 't2' },
          ],
        },
        sideArea: { items: [{ __typename: 'Promo', id: 'p1' }] },
      },
    ] as any

    const el: any = ContentAreaMapper({ blocks, preview: true })

    const wrappers = childrenOf(el)
    expect(wrappers.length).toBe(1)

    // children: [<Block Container/>, <Fragment slots>]
    const topKids = childrenOf(wrappers[0])
    expect(topKids.length).toBe(2)

    // Dive into the fragment that contains the slot <div>s
    const slotsFragment = topKids[1]
    const slotDivs = childrenOf(slotsFragment)
    expect(slotDivs.length).toBe(2)

    const mainSlot = slotDivs[0]
    const sideSlot = slotDivs[1]
    expect(mainSlot.props['data-slot-area']).toBe('mainArea')
    expect(sideSlot.props['data-slot-area']).toBe('sideArea')

    // The slot contains a <ContentAreaMapper blocks=.../> element.
    // Execute it to get the rendered fragment of nested wrappers.
    const mainInnerMapperEl = childrenOf(mainSlot)[0]
    const mainRendered = mainInnerMapperEl.type(mainInnerMapperEl.props)
    const mainNestedWrappers = childrenOf(mainRendered)

    const t1WrapKids = childrenOf(mainNestedWrappers[0])
    const t2WrapKids = childrenOf(mainNestedWrappers[1])
    const t1 = t1WrapKids[0]
    const t2 = t2WrapKids[0]

    expect(t1.props.typeName).toBe('Teaser')
    expect(t1.props.props.id).toBe('t1')
    expect(t2.props.props.id).toBe('t2')

    const sideInnerMapperEl = childrenOf(sideSlot)[0]
    const sideRendered = sideInnerMapperEl.type(sideInnerMapperEl.props)
    const sideNestedWrappers = childrenOf(sideRendered)
    const promo = childrenOf(sideNestedWrappers[0])[0]

    expect(promo.props.typeName).toBe('Promo')
    expect(promo.props.props.id).toBe('p1')
  })
})

describe('ContentAreaMapper (Visual Builder mode)', () => {
  it('returns null when experienceElements is empty', () => {
    expect(
      ContentAreaMapper({
        isVisualBuilder: true,
        experienceElements: null as any,
      })
    ).toBe(null)
    expect(ContentAreaMapper({ isVisualBuilder: true } as any)).toBe(null)
    expect(
      ContentAreaMapper({ isVisualBuilder: true, experienceElements: [] })
    ).toBe(null)
  })

  it('renders VB elements and forwards component/displaySettings + preview', () => {
    const experienceElements = [
      {
        key: 'vb-1',
        displaySettings: { width: 'full' },
        component: { __typename: 'Hero', id: 'h1', title: 'VB Hero' },
      },
      {
        key: 'vb-2',
        displaySettings: { width: 'half' },
        component: { __typename: 'Teaser', id: 't3' },
      },
    ] as any

    const el: any = ContentAreaMapper({
      isVisualBuilder: true,
      experienceElements,
      preview: true,
    })

    const wrappers = childrenOf(el)
    expect(wrappers.length).toBe(2)

    const firstKids = childrenOf(wrappers[0])
    const firstBlock = firstKids[0]
    expect(wrappers[0].props['data-epi-block-id']).toBe('vb-1')
    expect(firstBlock.type).toBe(Block)
    expect(firstBlock.props.typeName).toBe('Hero')
    expect(firstBlock.props.props).toMatchObject({
      id: 'h1',
      title: 'VB Hero',
      displaySettings: { width: 'full' },
      isFirst: true,
      preview: true,
    })

    const secondKids = childrenOf(wrappers[1])
    const secondBlock = secondKids[0]
    expect(wrappers[1].props['data-epi-block-id']).toBe('vb-2')
    expect(secondBlock.props.typeName).toBe('Teaser')
    expect(secondBlock.props.props).toMatchObject({
      id: 't3',
      displaySettings: { width: 'half' },
      isFirst: false,
      preview: true,
    })
  })

  it('recurses into nested slots in VB component payloads', () => {
    const experienceElements = [
      {
        key: 'vb-1',
        displaySettings: {},
        component: {
          __typename: 'Grid',
          id: 'g1',
          left: { items: [{ __typename: 'Promo', id: 'p1' }] },
          right: { items: [{ __typename: 'Teaser', id: 't4' }] },
        },
      },
    ] as any

    const el: any = ContentAreaMapper({
      isVisualBuilder: true,
      preview: true,
      experienceElements,
    })

    const firstWrap = childrenOf(el)[0]
    const kids = childrenOf(firstWrap)

    // kids: [<Block Grid/>, <Fragment slots>]
    expect(kids.length).toBe(2)

    const slotsFragment = kids[1]
    const slotDivs = childrenOf(slotsFragment)
    expect(slotDivs.length).toBe(2)
    expect(slotDivs[0].props['data-slot-area']).toBe('left')
    expect(slotDivs[1].props['data-slot-area']).toBe('right')

    // Execute the inner mapper in each slot to get the rendered nested wrappers
    const leftInnerMapperEl = childrenOf(slotDivs[0])[0]
    const leftRendered = leftInnerMapperEl.type(leftInnerMapperEl.props)
    const leftNestedWrappers = childrenOf(leftRendered)
    const leftBlock = childrenOf(leftNestedWrappers[0])[0]
    expect(leftBlock.props.typeName).toBe('Promo')
    expect(leftBlock.props.props.id).toBe('p1')

    const rightInnerMapperEl = childrenOf(slotDivs[1])[0]
    const rightRendered = rightInnerMapperEl.type(rightInnerMapperEl.props)
    const rightNestedWrappers = childrenOf(rightRendered)
    const rightBlock = childrenOf(rightNestedWrappers[0])[0]
    expect(rightBlock.props.typeName).toBe('Teaser')
    expect(rightBlock.props.props.id).toBe('t4')
  })
})
