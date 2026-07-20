import { token } from '@/tokens'

export default function Loading() {
  return (
    <main
      role="status"
      aria-label="Loading data patterns"
      aria-busy
      style={{ maxWidth: '52rem', margin: '0 auto', padding: `${token('space', '8')} ${token('space', '4')}`, display: 'grid', gap: token('space', '4') }}
    >
      {Array.from({ length: 3 }, (_, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            height: i === 0 ? '2rem' : '3rem',
            width: i === 0 ? '60%' : '100%',
            borderRadius: token('radius', 'md'),
            background: 'var(--color-border)'
          }}
        />
      ))}
    </main>
  )
}
