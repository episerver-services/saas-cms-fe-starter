/**
 * Fallback component shown when a CMS block type has no mapped renderer.
 * Provides a visible warning in the UI so developers/content editors
 * can identify missing block implementations.
 *
 * @param props - Component props.
 * @param props.typeName - The CMS block type that could not be rendered (defaults to `"UnknownBlock"`).
 *
 * @returns A styled <div> element displaying a warning message.
 */
export default function PlaceholderBlock({
  typeName = 'UnknownBlock',
}: {
  typeName?: string
}) {
  return (
    <div
      style={{
        padding: '1rem',
        margin: '1rem 0',
        background: '#fdd',
        color: '#900',
        border: '1px solid #c00',
      }}
    >
      ⚠️ No renderer for block type <strong>{typeName}</strong>
    </div>
  )
}
