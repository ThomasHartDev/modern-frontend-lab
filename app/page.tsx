import { ConceptCard, type ConceptStatus } from '@/components/concept-card'

interface Concept {
  title: string
  description: string
  status: ConceptStatus
  href?: string
}

const CONCEPTS: readonly Concept[] = [
  {
    title: 'Server Components & streaming',
    description: 'Render on the server, stream HTML as it resolves, and ship less JavaScript to the client.',
    status: 'planned'
  },
  {
    title: 'Suspense data fetching',
    description: 'Coordinate loading states with Suspense boundaries instead of scattered isLoading flags.',
    status: 'planned'
  },
  {
    title: 'Design tokens',
    description: 'A typed token system that stays the single origin for color, spacing, and type scale.',
    status: 'planned'
  },
  {
    title: 'List virtualization',
    description: 'Render only the rows in view to keep large lists at 60fps.',
    status: 'planned'
  },
  {
    title: 'Core Web Vitals budget',
    description: 'Track LCP, CLS, and INP against a budget so regressions fail loudly.',
    status: 'planned'
  }
]

export default function HomePage() {
  return (
    <main style={{ maxWidth: '52rem', margin: '0 auto', padding: 'var(--space-8) var(--space-4)' }}>
      <h1 style={{ marginBottom: 'var(--space-2)' }}>Modern Frontend Lab</h1>
      <p style={{ color: 'var(--color-muted)', marginTop: 0 }}>
        Each route demonstrates one front-end concept in Next.js 15 and React 19, with notes on the tradeoffs.
      </p>
      <section aria-label="Concepts" style={{ display: 'grid', gap: 'var(--space-4)', marginTop: 'var(--space-8)' }}>
        {CONCEPTS.map((concept) => (
          <ConceptCard key={concept.title} {...concept} />
        ))}
      </section>
    </main>
  )
}
