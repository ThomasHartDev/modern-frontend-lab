import { token } from '@/tokens'
import { AnimationDemo } from './demo'

export const metadata = {
  title: 'Performant animation - Modern Frontend Lab'
}

export default function AnimationPage() {
  return (
    <main style={{ maxWidth: '52rem', margin: '0 auto', padding: `${token('space', '8')} ${token('space', '4')}` }}>
      <h1>Performant animation</h1>
      <p style={{ color: token('color', 'muted'), marginTop: 0 }}>
        Smooth motion comes from animating compositor properties (<code>transform</code>, <code>opacity</code>)
        and from FLIP, which turns a layout change into a short transform. Under{' '}
        <code>prefers-reduced-motion</code>, jump to the end state.
      </p>
      <AnimationDemo />
      <section aria-label="Notes" style={{ marginTop: token('space', '8'), color: token('color', 'muted') }}>
        <h2 style={{ fontSize: token('fontSize', 'lg'), color: 'var(--color-text)' }}>
          FLIP, transforms, reduced motion
        </h2>
        <p>
          FLIP is First, Last, Invert, Play: measure, apply layout, measure again, cancel with a
          transform, then transition to identity. Animating <code>top</code>/<code>left</code>/
          <code>width</code> reflows every frame. Reduced motion zeros duration and skips invert.
        </p>
      </section>
    </main>
  )
}
