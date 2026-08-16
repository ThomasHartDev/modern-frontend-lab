import { token } from '@/tokens'
import { DEFAULT_BUDGET } from '@/cwv'
import { CwvDemo } from './demo'

export const metadata = {
  title: 'Core Web Vitals budget - Modern Frontend Lab'
}

export default function CwvPage() {
  return (
    <main style={{ maxWidth: '52rem', margin: '0 auto', padding: `${token('space', '8')} ${token('space', '4')}` }}>
      <h1>Core Web Vitals budget</h1>
      <p style={{ color: token('color', 'muted'), marginTop: 0 }}>
        Field performance is scored on Largest Contentful Paint (LCP), Interaction to Next Paint (INP),
        and Cumulative Layout Shift (CLS). A budget is a hard ceiling so regressions fail the report.
        This lab evaluates projected route samples against those ceilings (not a live field RUM panel).
      </p>
      <p style={{ color: token('color', 'muted'), fontFamily: 'var(--font-mono)', fontSize: token('fontSize', 'sm') }}>
        Budget: LCP ≤ {DEFAULT_BUDGET.LCP}ms · INP ≤ {DEFAULT_BUDGET.INP}ms · CLS ≤ {DEFAULT_BUDGET.CLS}
      </p>
      <CwvDemo />
      <section aria-label="Notes" style={{ marginTop: token('space', '8'), color: token('color', 'muted') }}>
        <h2 style={{ fontSize: token('fontSize', 'lg'), color: 'var(--color-text)' }}>What the numbers mean</h2>
        <p>
          LCP is largest text/image render time. INP is interaction-to-paint latency (lab: worst under 50
          samples, then ~98th percentile). CLS is the max session-window sum of layout shifts (1s gap, 5s
          cap; input-driven shifts excluded). The tables use projected samples from `projectRoute`. Slow
          panel: no reserved hero size and a late inject so content under it shifts; fixed panel uses
          aspect-ratio reservation. The INP probe reports click→first-frame separately from work duration.
        </p>
      </section>
    </main>
  )
}
