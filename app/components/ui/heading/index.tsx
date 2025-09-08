'use client'

type PageHeadingProps = {
  label: string
}

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
