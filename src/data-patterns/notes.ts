export interface Note {
  id: string
  text: string
  createdAt: number
}

export const MAX_NOTE_LENGTH = 140

export type Validation =
  | { ok: true; text: string }
  | { ok: false; error: string }

export function validateNoteText(raw: unknown): Validation {
  if (typeof raw !== 'string') return { ok: false, error: 'A note is required.' }
  const text = raw.trim()
  if (text.length === 0) return { ok: false, error: 'A note cannot be empty.' }
  if (text.length > MAX_NOTE_LENGTH) {
    return { ok: false, error: `Keep it to ${MAX_NOTE_LENGTH} characters or fewer.` }
  }
  return { ok: true, text }
}

export interface PendingNote {
  tempId: string
  text: string
}

export type DisplayNote =
  | { pending: false; id: string; text: string; createdAt: number }
  | { pending: true; tempId: string; text: string }

export function toDisplay(note: Note): DisplayNote {
  return { pending: false, id: note.id, text: note.text, createdAt: note.createdAt }
}

export function toDisplayList(notes: readonly Note[]): DisplayNote[] {
  return notes.map(toDisplay)
}

// useOptimistic folds each pending dispatch over the confirmed base one at a
// time, so this reducer only handles a single add. Newest sits on top, matching
// how the confirmed list is stored (most recent first).
export function reduceOptimistic(state: readonly DisplayNote[], pending: PendingNote): DisplayNote[] {
  return [{ pending: true, tempId: pending.tempId, text: pending.text }, ...state]
}

export interface Clock {
  now(): number
}

export type IdGen = () => string

export interface NotesStore {
  add(text: string): Promise<Note>
}

export function createNotesStore(opts: { clock?: Clock; ids?: IdGen } = {}): NotesStore {
  const clock = opts.clock ?? { now: () => Date.now() }
  const ids = opts.ids ?? (() => crypto.randomUUID())
  return {
    async add(text) {
      return { id: ids(), text, createdAt: clock.now() }
    }
  }
}

export interface FormState {
  notes: readonly Note[]
  error: string | null
}

export interface AddInput {
  text: unknown
  fail: boolean
}

// The authoritative mutation. On failure the previous list is returned untouched
// so the client can revert its optimistic guess and re-show the typed value. A
// thrown store error is treated the same as an explicit `fail`: the write did
// not land, so confirmed state must not move.
export async function applyAdd(prev: FormState, input: AddInput, store: NotesStore): Promise<FormState> {
  const validation = validateNoteText(input.text)
  if (!validation.ok) return { notes: prev.notes, error: validation.error }
  if (input.fail) return { notes: prev.notes, error: 'The server rejected the note. Try again.' }
  try {
    const note = await store.add(validation.text)
    return { notes: [note, ...prev.notes], error: null }
  } catch {
    return { notes: prev.notes, error: 'Something went wrong saving the note.' }
  }
}
