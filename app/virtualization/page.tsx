import { token } from '@/tokens'
import { VirtualizationDemo } from './demo'

export const metadata = {
  title: 'List virtualization - Modern Frontend Lab'
}

export default function VirtualizationPage() {
  return (
    <main style={{ maxWidth: '52rem', margin: '0 auto', padding: `${token('space', '8')} ${token('space', '4')}` }}>
      <h1>List virtualization</h1>
      <p style={{ color: token('color', 'muted'), marginTop: 0 }}>
        Large collections blow up layout and paint cost if every row becomes a DOM node. Windowing
        mounts only the rows that intersect the viewport (plus a small overscan buffer), keeps a
        tall spacer so the scrollbar still reflects the full list, and repositions the window as
        the user scrolls.
      </p>
      <VirtualizationDemo />
      <section aria-label="Notes" style={{ marginTop: token('space', '8'), color: token('color', 'muted') }}>
        <h2 style={{ fontSize: token('fontSize', 'lg'), color: 'var(--color-text)' }}>
          Fixed height, O(1) range
        </h2>
        <p>
          With a constant row height the start and end indices are pure arithmetic from{' '}
          <code>scrollTop</code>, so each scroll event is O(1) plus the cost of mounting the new
          window. Variable-height rows need a size cache and a search over cumulative offsets; that
          is a different algorithm. Overscan trades a few extra nodes for fewer white flashes when
          the user flicks past the current window. Virtualization is the wrong tool for short lists
          where the bookkeeping costs more than painting every row.
        </p>
      </section>
    </main>
  )
}
