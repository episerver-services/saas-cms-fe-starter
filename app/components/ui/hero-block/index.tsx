// Mock hero block for testing
type HeroBlockProps = {
  title?: string
  subtitle?: string
}

export default function HeroBlock({ title, subtitle }: HeroBlockProps) {
  return (
    <section className="border border-red-500 bg-red-100 p-6">
      <h1 className="text-3xl font-bold">{title ?? 'Missing title'}</h1>
      {subtitle && <p className="text-lg mt-2">{subtitle}</p>}
    </section>
  )
}
