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
