/** @jest-environment node */

jest.mock('../content-area/mapper', () => {
  // mock as a function component; when NOT rendering, .type will be this function
  const Comp = (props: any) => ({ type: 'mapper-stub', props })
  return { __esModule: true, default: Comp }
})

import Wrapper from './wrapper'
import Mapper from '../content-area/mapper' // <-- the mocked function

const childrenOf = (el: any) =>
  el && el.props && Array.isArray(el.props.children)
    ? el.props.children
    : el?.props?.children
      ? [el.props.children]
      : []

/** Return the array of top-level *node wrappers* (section/component). */
const nodeWrappers = (el: any) => {
  const outer = childrenOf(el) // [ <div.inner> ]
  const inner = childrenOf(outer[0]) // [ ...node wrappers... ]
  return inner
}

describe('VisualBuilderExperienceWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns null when experience or nodes are missing', () => {
    expect(Wrapper({})).toBe(null)
    // @ts-expect-error: intentionally incomplete
    expect(Wrapper({ experience: {} })).toBe(null)
    // @ts-expect-error: intentionally incomplete
    expect(Wrapper({ experience: { composition: {} } })).toBe(null)
  })

  it('renders a section node with rows/columns; passes experienceElements + isVisualBuilder', () => {
    const experience = {
      composition: {
        nodes: [
          {
            nodeType: 'section',
            key: 'sec-1',
            rows: [
              {
                key: 'row-1',
                columns: [
                  {
                    key: 'col-1',
                    elements: [
                      {
                        key: 'el-1',
                        component: { __typename: 'HeroBlock', id: 'h1' },
                        displaySettings: { width: 'full' },
                      },
                    ],
                  },
                  {
                    key: 'col-2',
                    elements: [
                      {
                        key: 'el-2',
                        component: { __typename: 'PromoBlock', id: 'p1' },
                        displaySettings: { width: 'half' },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    }

    const el: any = Wrapper({ experience } as any)
    const wrappers = nodeWrappers(el)

    const section = wrappers[0]
    expect(section.props['data-epi-block-id']).toBe('sec-1')

    const rows = childrenOf(section)
    expect(rows).toHaveLength(1)
    const row = rows[0]
    const cols = childrenOf(row)
    expect(cols).toHaveLength(2)

    const col1Mapper = childrenOf(cols[0])[0]
    const col2Mapper = childrenOf(cols[1])[0]

    // type is the mocked function component
    expect(col1Mapper.type).toBe(Mapper)
    expect(col2Mapper.type).toBe(Mapper)

    expect(col1Mapper.props.isVisualBuilder).toBe(true)
    expect(col2Mapper.props.isVisualBuilder).toBe(true)
    expect(Array.isArray(col1Mapper.props.experienceElements)).toBe(true)
    expect(Array.isArray(col2Mapper.props.experienceElements)).toBe(true)
    expect(col1Mapper.props.experienceElements).toHaveLength(1)
    expect(col2Mapper.props.experienceElements).toHaveLength(1)
  })

  it('renders a standalone component node via blocks', () => {
    const experience = {
      composition: {
        nodes: [
          {
            nodeType: 'component',
            key: 'cmp-1',
            component: { __typename: 'HeroBlock', id: 'hero-1' },
          },
        ],
      },
    }

    const el: any = Wrapper({ experience } as any)
    const wrappers = nodeWrappers(el)
    expect(wrappers).toHaveLength(1)

    const compWrapper = wrappers[0]
    expect(compWrapper.props['data-epi-block-id']).toBe('cmp-1')

    const mapperCall = childrenOf(compWrapper)[0]
    expect(mapperCall.type).toBe(Mapper)
    expect(Array.isArray(mapperCall.props.blocks)).toBe(true)
    expect(mapperCall.props.blocks).toHaveLength(1)
    expect(mapperCall.props.blocks[0].id).toBe('hero-1')
  })

  it('supports mixed nodes (section + component) in order', () => {
    const experience = {
      composition: {
        nodes: [
          {
            nodeType: 'section',
            key: 'sec-1',
            rows: [{ key: 'r1', columns: [{ key: 'c1', elements: [] }] }],
          },
          {
            nodeType: 'component',
            key: 'cmp-2',
            component: { __typename: 'PromoBlock', id: 'promo-2' },
          },
        ],
      },
    }

    const el: any = Wrapper({ experience } as any)
    const wrappers = nodeWrappers(el)

    expect(wrappers).toHaveLength(2)

    const section = wrappers[0]
    const compWrapper = wrappers[1]

    expect(section.props['data-epi-block-id']).toBe('sec-1')

    const mapperChild = childrenOf(compWrapper)[0]
    expect(mapperChild.type).toBe(Mapper)
    expect(mapperChild.props.blocks[0].id).toBe('promo-2')
  })

  it('gracefully handles empty/undefined rows, columns, and elements', () => {
    const experience = {
      composition: {
        nodes: [
          { nodeType: 'section', key: 'sec-empty' },
          {
            nodeType: 'section',
            key: 'sec-empty2',
            rows: [{ key: 'r-empty' }],
          },
          {
            nodeType: 'section',
            key: 'sec-empty3',
            rows: [{ key: 'r2', columns: [{ key: 'c-empty' }] }],
          },
        ],
      },
    }

    const el: any = Wrapper({ experience } as any)
    const wrappers = nodeWrappers(el)
    expect(wrappers).toHaveLength(3)
  })
})
