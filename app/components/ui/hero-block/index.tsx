// -----------------------------------------------------------------------------
// Placeholder Hero Block component.
// Provides a mock implementation for testing block rendering from the CMS.
// Styles and structure will be replaced once real design requirements are defined.
// -----------------------------------------------------------------------------

/**
 * Props for the HeroBlock component.
 */
export type HeroBlockProps = {
  /** Main title text (falls back to "Missing title" if omitted). */
  title?: string
  /** Optional subtitle text displayed below the title. */
  subtitle?: string
}

/**
 * Mock Hero Block for testing.
 *
 * Renders a simple section with a title and optional subtitle.
 * Used as a placeholder until a real HeroBlock design is implemented.
 */
export default function HeroBlock({ title, subtitle }: HeroBlockProps) {
  return (
    <section className="border border-red-500 bg-red-100 p-6">
      <h1 className="text-3xl font-bold">{title ?? 'Missing title'}</h1>
      {subtitle && <p className="mt-2 text-lg">{subtitle}</p>}
    </section>
  )
}
