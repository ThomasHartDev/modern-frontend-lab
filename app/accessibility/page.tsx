import { token } from '@/tokens'
import { AccessibilityDemo } from './demo'

export const metadata = {
  title: 'Accessible components - Modern Frontend Lab'
}

export default function AccessibilityPage() {
  return (
    <main style={{ maxWidth: '52rem', margin: '0 auto', padding: `${token('space', '8')} ${token('space', '4')}` }}>
      <h1>Accessible components</h1>
      <p style={{ color: token('color', 'muted'), marginTop: 0 }}>
        Focus enters a modal and returns on close. Tab stays inside while open. Composite widgets use
        a roving tabindex so arrows move selection without stuffing every control into the Tab
        sequence. axe-core catches structural gaps; keyboard passes catch the rest.
      </p>
      <AccessibilityDemo />
      <section aria-label="Notes" style={{ marginTop: token('space', '8'), color: token('color', 'muted') }}>
        <h2 style={{ fontSize: token('fontSize', 'lg'), color: 'var(--color-text)' }}>Focus, ARIA, and keyboard</h2>
        <p>
          A focus trap cycles Tab over tabbable nodes inside a modal. Roving tabindex sets{' '}
          <code>tabIndex=0</code> on the active item and <code>-1</code> on siblings so the composite
          is one Tab stop. ARIA roles describe the widget; they never replace keyboard and focus
          behavior. axe-core runs WCAG rules against the rendered DOM as a floor, not a full AT pass.
        </p>
      </section>
    </main>
  )
}
