import { token } from '@/tokens'

export default function Loading() {
  return (
    <main
      role="status"
      aria-label="Loading Server Components & streaming"
      aria-busy
      style={{ maxWidth: '52rem', margin: '0 auto', padding: `${token('space', '8')} ${token('space', '4')}`, color: token('color', 'muted') }}
    >
      Loading…
    </main>
  )
}
