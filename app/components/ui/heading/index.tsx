// -----------------------------------------------------------------------------
// Placeholder Page Heading component.
// Provides a simple styled <header> element for debugging and layout scaffolding.
// Final typography, colour tokens, and spacing should be replaced once the
// design system is finalised.
// -----------------------------------------------------------------------------

'use client'

/**
 * Props for the `Heading` component.
 */
export type PageHeadingProps = {
  /** Text label to display inside the heading. */
  label: string
}

/**
 * Renders a simple placeholder heading.
 *
 * @param label - The text string to render as the heading.
 * @returns A styled <header> element.
 */
export function Heading({ label }: PageHeadingProps) {
  return (
    <header
      style={{
        backgroundColor: '#eef',
        borderBottom: '1px solid #ccd',
        padding: '0.5rem 1rem',
        fontWeight: 'bold',
        fontSize: '1rem',
        color: '#223',
      }}
    >
      {label}
    </header>
  )
}
