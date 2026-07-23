import { token } from '@/tokens'
import { StateDemo } from './demo'
export const metadata = {
  title: 'Client state: reducer + context vs a store - Modern Frontend Lab'
}
export default function StateManagementPage() {
  return (
    <main style={{ maxWidth: '52rem', margin: '0 auto', padding: `${token('space', '8')} ${token('space', '4')}` }}>
      <h1>Client state: reducer + context vs a store</h1>
      <p style={{ color: token('color', 'muted'), marginTop: 0 }}>
        Both panels share the same pure cart reducer. Context is on the left; an external store with
        <code> useSyncExternalStore</code> selectors is on the right. Type in the note field and watch the render counters:
        context re-renders every state consumer; the store only re-renders components whose selected value changed.
      </p>
      <StateDemo />
      <section aria-label="Notes" style={{ marginTop: token('space', '8'), color: token('color', 'muted') }}>
        <h2 style={{ fontSize: token('fontSize', 'lg'), color: 'var(--color-text)' }}>When each wins</h2>
        <p>
          Context fits tree-scoped UI that updates infrequently or where most consumers need most of the state. Split
          state and dispatch contexts so pure dispatchers stay quiet. An external store wins when many leaves each need a
          thin slice, updates are high-frequency, or non-React code shares the state. Selectors must return stable values;
          a fresh object every call throws away the re-render savings.
        </p>
      </section>
    </main>
  )
}
