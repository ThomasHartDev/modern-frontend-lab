import {
  applyWaitlistSubmit,
  createWaitlistStore,
  initialWaitlistState,
  type WaitlistState
} from '@/forms/waitlist'
import { token } from '@/tokens'
import { WaitlistForm } from './waitlist-form'

export const metadata = {
  title: 'Robust forms - Modern Frontend Lab'
}

const SEED = initialWaitlistState()

async function submitWaitlist(prev: WaitlistState, formData: FormData): Promise<WaitlistState> {
  'use server'
  return applyWaitlistSubmit(prev, formData, createWaitlistStore(), {
    fail: formData.get('fail') === 'on'
  })
}

export default function FormsPage() {
  return (
    <main style={{ maxWidth: '52rem', margin: '0 auto', padding: `${token('space', '8')} ${token('space', '4')}` }}>
      <h1>Robust forms</h1>
      <p style={{ color: token('color', 'muted'), marginTop: 0 }}>
        A waitlist form posts to a Server Action. The same pure validator runs on every submit. With
        JavaScript on, <code>useActionState</code> rehydrates field values and errors after a failed
        attempt, and <code>useFormStatus</code> drives the pending button. HTML constraints document
        intent; the form uses <code>noValidate</code> so the shared schema is the single error source
        in this demo.
      </p>
      <WaitlistForm action={submitWaitlist} initial={SEED} />
      <section aria-label="Notes" style={{ marginTop: token('space', '8'), color: token('color', 'muted') }}>
        <h2 style={{ fontSize: token('fontSize', 'lg'), color: 'var(--color-text)' }}>Why this shape</h2>
        <p>
          Client-only validation is easy to skip and drift from the server. The mutation core lives in{' '}
          <code>applyWaitlistSubmit</code>: parse FormData, validate, then write. Field errors stay keyed
          by input name for <code>aria-invalid</code> / <code>aria-describedby</code>. On failure the raw
          values come back as <code>defaultValue</code>s (uncontrolled PE). Pending state lives inside the
          form via <code>useFormStatus</code>.
        </p>
      </section>
    </main>
  )
}
