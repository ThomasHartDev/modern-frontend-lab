import { token } from '@/tokens'

// Shown while the route segment itself is still resolving on the server. The
// per-card Suspense fallbacks in page.tsx take over once the shell streams in.
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
