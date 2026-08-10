'use client'

import { useActionState, useId, type CSSProperties, type InputHTMLAttributes, type ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { NAME_MAX, SEAT_MAX, SEAT_MIN, type WaitlistState } from '@/forms/waitlist'
import { token } from '@/tokens'

interface WaitlistFormProps {
  action: (prev: WaitlistState, formData: FormData) => Promise<WaitlistState>
  initial: WaitlistState
}

const card: CSSProperties = {
  padding: token('space', '4'),
  border: '1px solid var(--color-border)',
  borderRadius: token('radius', 'md'),
  background: 'var(--color-surface)'
}

const fieldInput: CSSProperties = {
  padding: token('space', '2'),
  borderRadius: token('radius', 'md'),
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  width: '100%',
  boxSizing: 'border-box'
}

function TextField({
  id,
  label,
  error,
  ...input
}: { id: string; label: ReactNode; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const errId = `${id}-err`
  return (
    <div style={{ display: 'grid', gap: token('space', '2') }}>
      <label htmlFor={id} style={{ fontSize: token('fontSize', 'sm'), color: token('color', 'muted') }}>
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errId : undefined}
        style={fieldInput}
        {...input}
      />
      {error ? (
        <p id={errId} role="alert" style={{ margin: 0, fontSize: token('fontSize', 'sm'), color: token('color', 'danger') }}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

function SubmitRow() {
  const { pending } = useFormStatus()
  return (
    <div style={{ display: 'flex', gap: token('space', '3'), alignItems: 'center', flexWrap: 'wrap' }}>
      <button
        type="submit"
        disabled={pending}
        aria-disabled={pending}
        style={{
          padding: `${token('space', '2')} ${token('space', '4')}`,
          borderRadius: token('radius', 'md'),
          border: '1px solid var(--color-border)',
          background: pending ? 'var(--color-border)' : 'var(--color-accent)',
          color: pending ? 'var(--color-muted)' : 'var(--color-surface)',
          cursor: pending ? 'progress' : 'pointer'
        }}
      >
        {pending ? 'Submitting…' : 'Join waitlist'}
      </button>
      {pending ? (
        <p aria-live="polite" style={{ margin: 0, fontSize: token('fontSize', 'sm'), color: token('color', 'muted') }}>
          Saving your registration…
        </p>
      ) : null}
    </div>
  )
}

export function WaitlistForm({ action, initial }: WaitlistFormProps) {
  const [state, formAction] = useActionState(action, initial)
  const base = useId()
  const { fields, fieldErrors, formError, submission, status } = state
  // Remount after success so uncontrolled inputs reset to empty defaults.
  const formKey = status === 'success' && submission ? submission.id : 'active'

  return (
    <div style={{ display: 'grid', gap: token('space', '6'), marginTop: token('space', '8') }}>
      <form
        key={formKey}
        action={formAction}
        noValidate
        aria-describedby={formError ? `${base}-form` : undefined}
        style={{ ...card, display: 'grid', gap: token('space', '3') }}
      >
        <TextField id={`${base}-name`} name="name" label="Name" type="text" required maxLength={NAME_MAX} autoComplete="name" defaultValue={fields.name} error={fieldErrors.name} />
        <TextField id={`${base}-email`} name="email" label="Email" type="email" required autoComplete="email" defaultValue={fields.email} error={fieldErrors.email} />
        <TextField id={`${base}-seats`} name="seats" label="Seats" type="number" required min={SEAT_MIN} max={SEAT_MAX} step={1} defaultValue={fields.seats} error={fieldErrors.seats} style={{ ...fieldInput, maxWidth: '8rem' }} />
        <div style={{ display: 'grid', gap: token('space', '2') }}>
          <label htmlFor={`${base}-agree`} style={{ display: 'flex', gap: token('space', '2'), fontSize: token('fontSize', 'sm'), color: token('color', 'muted') }}>
            <input
              id={`${base}-agree`}
              name="agree"
              type="checkbox"
              required
              value="on"
              defaultChecked={fields.agree}
              aria-invalid={fieldErrors.agree ? true : undefined}
              aria-describedby={fieldErrors.agree ? `${base}-agree-err` : undefined}
            />
            I agree to the waitlist terms
          </label>
          {fieldErrors.agree ? (
            <p id={`${base}-agree-err`} role="alert" style={{ margin: 0, fontSize: token('fontSize', 'sm'), color: token('color', 'danger') }}>
              {fieldErrors.agree}
            </p>
          ) : null}
        </div>
        <label style={{ display: 'flex', gap: token('space', '2'), fontSize: token('fontSize', 'sm'), color: token('color', 'muted') }}>
          <input name="fail" type="checkbox" />
          Simulate a server failure
        </label>
        <SubmitRow />
      </form>
      {formError ? (
        <p id={`${base}-form`} role="alert" style={{ margin: 0, color: token('color', 'danger') }}>
          {formError}
        </p>
      ) : null}
      {status === 'success' && submission ? (
        <div role="status" aria-live="polite" style={{ ...card, borderColor: 'var(--color-accent)' }}>
          <p style={{ margin: 0 }}>
            You&apos;re on the list as <strong>{submission.name}</strong> ({submission.email}) for {submission.seats} seat
            {submission.seats === 1 ? '' : 's'}.
          </p>
          <p style={{ margin: `${token('space', '2')} 0 0`, fontSize: token('fontSize', 'sm'), color: token('color', 'muted') }}>
            Confirmation id {submission.id}
          </p>
        </div>
      ) : null}
    </div>
  )
}
