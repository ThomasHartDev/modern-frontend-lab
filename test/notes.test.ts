import {
  applyAdd,
  createNotesStore,
  MAX_NOTE_LENGTH,
  reduceOptimistic,
  toDisplayList,
  validateNoteText,
  type Clock,
  type DisplayNote,
  type FormState,
  type IdGen,
  type Note
} from '@/data-patterns/notes'

const fixedClock: Clock = { now: () => 1000 }

function sequentialIds(): IdGen {
  let n = 0
  return () => `n${(n += 1)}`
}

describe('validateNoteText', () => {
  it('trims and accepts real text', () => {
    expect(validateNoteText('  hello  ')).toEqual({ ok: true, text: 'hello' })
  })

  it('rejects empty and whitespace-only input', () => {
    expect(validateNoteText('')).toEqual({ ok: false, error: 'A note cannot be empty.' })
    expect(validateNoteText('   ')).toEqual({ ok: false, error: 'A note cannot be empty.' })
  })

  it('rejects non-strings coming off FormData', () => {
    expect(validateNoteText(null)).toMatchObject({ ok: false })
    expect(validateNoteText(undefined)).toMatchObject({ ok: false })
    expect(validateNoteText(42)).toMatchObject({ ok: false })
  })

  it('accepts exactly the max length and rejects one over', () => {
    const atLimit = 'a'.repeat(MAX_NOTE_LENGTH)
    expect(validateNoteText(atLimit)).toEqual({ ok: true, text: atLimit })
    const over = 'a'.repeat(MAX_NOTE_LENGTH + 1)
    expect(validateNoteText(over)).toMatchObject({ ok: false })
  })

  it('measures length after trimming, so padded max-length text still passes', () => {
    const padded = `  ${'a'.repeat(MAX_NOTE_LENGTH)}  `
    expect(validateNoteText(padded)).toEqual({ ok: true, text: 'a'.repeat(MAX_NOTE_LENGTH) })
  })
})

describe('reduceOptimistic', () => {
  it('prepends a single pending note to the confirmed base', () => {
    const base = toDisplayList([{ id: '1', text: 'first', createdAt: 0 }])
    const next = reduceOptimistic(base, { tempId: 't1', text: 'typing' })
    expect(next).toHaveLength(2)
    expect(next[0]).toEqual({ pending: true, tempId: 't1', text: 'typing' })
    expect(next[1]).toMatchObject({ pending: false, id: '1' })
  })

  it('stacks when folded twice, newest on top, matching React folding pending dispatches', () => {
    const base: DisplayNote[] = []
    const once = reduceOptimistic(base, { tempId: 't1', text: 'one' })
    const twice = reduceOptimistic(once, { tempId: 't2', text: 'two' })
    expect(twice.map((n) => (n.pending ? n.text : null))).toEqual(['two', 'one'])
  })

  it('does not mutate the base list', () => {
    const base = toDisplayList([{ id: '1', text: 'first', createdAt: 0 }])
    reduceOptimistic(base, { tempId: 't1', text: 'x' })
    expect(base).toHaveLength(1)
  })
})

describe('applyAdd', () => {
  const store = createNotesStore({ clock: fixedClock, ids: sequentialIds() })

  it('adds a validated note to the front and clears the error', async () => {
    const prev: FormState = { notes: [{ id: 'seed', text: 'seed', createdAt: 0 }], error: 'stale' }
    const next = await applyAdd(prev, { text: '  new  ', fail: false }, store)
    expect(next.error).toBeNull()
    expect(next.notes[0]).toMatchObject({ text: 'new', createdAt: 1000 })
    expect(next.notes[1]?.id).toBe('seed')
  })

  it('keeps the confirmed list untouched on a validation error', async () => {
    const prev: FormState = { notes: [{ id: 'seed', text: 'seed', createdAt: 0 }], error: null }
    const next = await applyAdd(prev, { text: '   ', fail: false }, store)
    expect(next.notes).toBe(prev.notes)
    expect(next.error).toBe('A note cannot be empty.')
  })

  it('does not mutate confirmed state when the write is asked to fail', async () => {
    const prev: FormState = { notes: [{ id: 'seed', text: 'seed', createdAt: 0 }], error: null }
    const next = await applyAdd(prev, { text: 'valid', fail: true }, store)
    expect(next.notes).toBe(prev.notes)
    expect(next.error).toMatch(/rejected/)
  })

  it('reverts to the prior list when the store throws', async () => {
    const throwing = {
      add(): Promise<Note> {
        return Promise.reject(new Error('network down'))
      }
    }
    const prev: FormState = { notes: [{ id: 'seed', text: 'seed', createdAt: 0 }], error: null }
    const next = await applyAdd(prev, { text: 'valid', fail: false }, throwing)
    expect(next.notes).toBe(prev.notes)
    expect(next.error).toMatch(/went wrong/)
  })

  it('assigns distinct ids across sequential writes so concurrent optimistic notes reconcile cleanly', async () => {
    const fresh = createNotesStore({ clock: fixedClock, ids: sequentialIds() })
    const a = await applyAdd({ notes: [], error: null }, { text: 'a', fail: false }, fresh)
    const b = await applyAdd(a, { text: 'b', fail: false }, fresh)
    const ids = b.notes.map((n) => n.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
