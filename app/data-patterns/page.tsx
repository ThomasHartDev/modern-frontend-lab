import { applyAdd, createNotesStore, type FormState } from '@/data-patterns/notes'
import { token } from '@/tokens'
import { NoteForm } from './note-form'

export const metadata = {
  title: 'Data fetching, server actions & optimistic UI - Modern Frontend Lab'
}

const SEED: FormState = { notes: [], error: null }

async function addNote(prev: FormState, formData: FormData): Promise<FormState> {
  'use server'
  const store = createNotesStore()
  return applyAdd(prev, { text: formData.get('text'), fail: formData.get('fail') === 'on' }, store)
}

export default function DataPatternsPage() {
  return (
    <main style={{ maxWidth: '52rem', margin: '0 auto', padding: `${token('space', '8')} ${token('space', '4')}` }}>
      <h1>Data fetching, server actions &amp; optimistic UI</h1>
      <p style={{ color: token('color', 'muted'), marginTop: 0 }}>
        The form posts to a Server Action, so there is no client fetch handler and no client-side API layer. The new note
        shows the instant you submit via <code>useOptimistic</code>, then reconciles against what the server returns. Tick
        &ldquo;simulate a failure&rdquo; to watch the optimistic note revert and an error render in its place.
      </p>

      <NoteForm action={addNote} initial={SEED} />

      <section aria-label="Notes" style={{ marginTop: token('space', '8'), color: token('color', 'muted') }}>
        <h2 style={{ fontSize: token('fontSize', 'lg'), color: 'var(--color-text)' }}>Why this shape</h2>
        <p>
          Three states share one flow. <code>useActionState</code> holds the confirmed list and the last error and exposes
          the pending flag. <code>useOptimistic</code> overlays the in-flight note on top of that confirmed list, and React
          discards the overlay automatically when the action settles, so a rejected write reverts on its own with no manual
          rollback. <code>useFormStatus</code> reads the pending state from inside the form to disable the button. The
          overlay is only a prediction: the server is still the source of truth, and on error the confirmed list never
          moved.
        </p>
      </section>
    </main>
  )
}
