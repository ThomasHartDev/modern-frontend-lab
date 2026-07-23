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
    status: 'done',
    href: '/streaming'
  },
  {
    title: 'Server actions & optimistic UI',
    description: 'Mutate through a Server Action and show the result instantly with useOptimistic, reverting on failure.',
    status: 'done',
    href: '/data-patterns'
  },
  {
    title: 'Client state: context vs store',
    description: 'Same pure reducer, two hosts: React Context re-renders every consumer; a store selects slices.',
    status: 'done',
    href: '/state-management'
  },
  {
    title: 'Design tokens',
    description: 'A typed token system that stays the single origin for color, spacing, and type scale.',
    status: 'done',
    href: '/tokens'
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
