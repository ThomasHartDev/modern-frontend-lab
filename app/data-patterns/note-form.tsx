'use client'

import { useActionState, useOptimistic, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { MAX_NOTE_LENGTH, reduceOptimistic, toDisplayList, type FormState } from '@/data-patterns/notes'
import { token } from '@/tokens'

interface NoteFormProps {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  initial: FormState
}

const cardStyle: React.CSSProperties = {
  padding: token('space', '4'),
  border: '1px solid var(--color-border)',
  borderRadius: token('radius', 'md'),
  background: 'var(--color-surface)'
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
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
      {pending ? 'Saving...' : 'Add note'}
    </button>
  )
}

export function NoteForm({ action, initial }: NoteFormProps) {
  const [state, dispatch] = useActionState(action, initial)
  const [optimistic, addOptimistic] = useOptimistic(toDisplayList(state.notes), reduceOptimistic)
  const formRef = useRef<HTMLFormElement>(null)

  async function onSubmit(formData: FormData) {
    const text = String(formData.get('text') ?? '').trim()
    if (text.length > 0) addOptimistic({ tempId: crypto.randomUUID(), text })
    formRef.current?.reset()
    await dispatch(formData)
  }

  return (
    <div style={{ display: 'grid', gap: token('space', '6'), marginTop: token('space', '8') }}>
      <form ref={formRef} action={onSubmit} style={{ ...cardStyle, display: 'grid', gap: token('space', '3') }}>
        <label htmlFor="text" style={{ fontSize: token('fontSize', 'sm'), color: token('color', 'muted') }}>
          New note
        </label>
        <input
          id="text"
          name="text"
          type="text"
          maxLength={MAX_NOTE_LENGTH}
          autoComplete="off"
          placeholder="Type something and submit"
          style={{
            padding: token('space', '2'),
            borderRadius: token('radius', 'md'),
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            color: 'var(--color-text)'
          }}
        />
        <label style={{ display: 'flex', gap: token('space', '2'), fontSize: token('fontSize', 'sm'), color: token('color', 'muted') }}>
          <input name="fail" type="checkbox" />
          Simulate a failure
        </label>
        <div>
          <SubmitButton />
        </div>
      </form>

      {state.error !== null ? (
        <p role="alert" style={{ margin: 0, color: token('color', 'danger') }}>
          {state.error}
        </p>
      ) : null}

      {optimistic.length === 0 ? (
        <p style={{ margin: 0, color: token('color', 'muted') }}>No notes yet. Add the first one.</p>
      ) : (
        <ul aria-label="Notes" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: token('space', '3') }}>
          {optimistic.map((note) => (
            <li
              key={note.pending ? note.tempId : note.id}
              aria-busy={note.pending}
              style={{ ...cardStyle, opacity: note.pending ? 0.55 : 1 }}
            >
              {note.text}
              {note.pending ? (
                <span style={{ marginLeft: token('space', '2'), fontSize: token('fontSize', 'sm'), color: token('color', 'muted') }}>
                  saving...
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
