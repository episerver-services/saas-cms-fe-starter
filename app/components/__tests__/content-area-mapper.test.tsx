import { render, screen } from '@testing-library/react'
import ContentAreaMapper from '@/app/components/content-area/mapper'

jest.mock('@/app/components/content-area/block', () => ({
  __esModule: true,
  default: ({ typeName, props }: any) => (
    <div data-testid="mock-block" data-type={typeName}>
      {props?.heading ?? 'Mock Block'}
    </div>
  ),
}))

describe.skip('ContentAreaMapper', () => {
  it('renders a single CMS block', () => {
    const blocks = [{ __typename: 'HeroBlock', heading: 'Welcome!' }]
    render(<ContentAreaMapper blocks={blocks} />)

    const block = screen.getByTestId('mock-block')
    expect(block).toBeInTheDocument()
    expect(block).toHaveAttribute('data-type', 'HeroBlock')
    expect(block).toHaveTextContent('Welcome!')
  })

  it('returns null for empty block array', () => {
    const { container } = render(<ContentAreaMapper blocks={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('recursively renders nested slots', () => {
    const blocks = [
      {
        __typename: 'TwoColumnBlock',
        leftColumn: {
          items: [{ __typename: 'TextBlock', heading: 'Left block' }],
        },
        rightColumn: {
          items: [{ __typename: 'TextBlock', heading: 'Right block' }],
        },
      },
    ]

    render(<ContentAreaMapper blocks={blocks} />)

    const allBlocks = screen.getAllByTestId('mock-block')
    expect(allBlocks).toHaveLength(3)
    expect(allBlocks[1]).toHaveTextContent('Left block')
    expect(allBlocks[2]).toHaveTextContent('Right block')
  })
})
