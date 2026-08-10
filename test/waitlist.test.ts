import {
  applyWaitlistSubmit,
  createWaitlistStore,
  emptyFields,
  initialWaitlistState,
  NAME_MAX,
  parseWaitlistForm,
  SEAT_MAX,
  SEAT_MIN,
  validateWaitlist,
  type Clock,
  type IdGen,
  type ValidatedWaitlist,
  type WaitlistFields,
  type WaitlistSubmission
} from '@/forms/waitlist'

const fixedClock: Clock = { now: () => 1_700_000_000_000 }

function sequentialIds(): IdGen {
  let n = 0
  return () => `w${(n += 1)}`
}

function fields(overrides: Partial<WaitlistFields> = {}): WaitlistFields {
  return { name: 'Ada Lovelace', email: 'ada@example.com', seats: '2', agree: true, ...overrides }
}

function toFormData(input: Partial<WaitlistFields> & { fail?: boolean } = {}): FormData {
  const f = fields(input)
  const fd = new FormData()
  fd.set('name', f.name)
  fd.set('email', f.email)
  fd.set('seats', f.seats)
  if (f.agree) fd.set('agree', 'on')
  if (input.fail) fd.set('fail', 'on')
  return fd
}

describe('parseWaitlistForm', () => {
  it('reads string fields and treats missing agree as false', () => {
    const fd = new FormData()
    fd.set('name', '  Sam  ')
    fd.set('email', 'sam@ex.com')
    fd.set('seats', '3')
    expect(parseWaitlistForm(fd)).toEqual({ name: '  Sam  ', email: 'sam@ex.com', seats: '3', agree: false })
  })

  it('accepts agree=true as well as the checkbox on value', () => {
    const fd = new FormData()
    fd.set('agree', 'true')
    expect(parseWaitlistForm(fd).agree).toBe(true)
  })
})

describe('validateWaitlist', () => {
  it('accepts a well-formed registration and normalizes email + trim', () => {
    expect(validateWaitlist(fields({ name: '  Ada  ', email: '  Ada@Example.COM  ' }))).toEqual({
      ok: true,
      data: { name: 'Ada', email: 'ada@example.com', seats: 2 }
    })
  })

  it('rejects empty, whitespace-only, and over-long names', () => {
    expect(validateWaitlist(fields({ name: '' }))).toMatchObject({ fieldErrors: { name: 'Name is required.' } })
    expect(validateWaitlist(fields({ name: '   ' }))).toMatchObject({ fieldErrors: { name: 'Name is required.' } })
    expect(validateWaitlist(fields({ name: 'a'.repeat(NAME_MAX + 1) }))).toMatchObject({
      fieldErrors: { name: expect.stringMatching(/80/) }
    })
    expect(validateWaitlist(fields({ name: 'a'.repeat(NAME_MAX) })).ok).toBe(true)
  })

  it('rejects missing and malformed email', () => {
    expect(validateWaitlist(fields({ email: '' }))).toMatchObject({ fieldErrors: { email: 'Email is required.' } })
    expect(validateWaitlist(fields({ email: 'not-an-email' }))).toMatchObject({
      fieldErrors: { email: 'Enter a valid email address.' }
    })
    expect(validateWaitlist(fields({ email: 'a@b' })).ok).toBe(false)
    expect(validateWaitlist(fields({ email: 'a b@c.com' })).ok).toBe(false)
  })

  it('enforces seats as a whole number inside the inclusive range', () => {
    expect(validateWaitlist(fields({ seats: '' }))).toMatchObject({ fieldErrors: { seats: 'Seats is required.' } })
    expect(validateWaitlist(fields({ seats: '2.5' }))).toMatchObject({ fieldErrors: { seats: 'Seats must be a whole number.' } })
    expect(validateWaitlist(fields({ seats: '0' }))).toMatchObject({
      fieldErrors: { seats: `Seats must be between ${SEAT_MIN} and ${SEAT_MAX}.` }
    })
    expect(validateWaitlist(fields({ seats: String(SEAT_MAX + 1) })).ok).toBe(false)
    expect(validateWaitlist(fields({ seats: String(SEAT_MIN) })).ok).toBe(true)
    expect(validateWaitlist(fields({ seats: String(SEAT_MAX) })).ok).toBe(true)
  })

  it('requires terms and collects multi-field errors in one pass', () => {
    expect(validateWaitlist(fields({ agree: false }))).toMatchObject({
      fieldErrors: { agree: 'You must accept the terms.' }
    })
    const result = validateWaitlist({ name: '', email: 'bad', seats: '99', agree: false })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(Object.keys(result.fieldErrors).sort()).toEqual(['agree', 'email', 'name', 'seats'])
    expect(result.formError).toMatch(/highlighted/)
  })
})

describe('applyWaitlistSubmit', () => {
  const store = createWaitlistStore({ clock: fixedClock, ids: sequentialIds() })
  const idle = initialWaitlistState()

  it('returns success, clears fields, and stamps id + createdAt', async () => {
    const next = await applyWaitlistSubmit(idle, toFormData(), store)
    expect(next.status).toBe('success')
    expect(next.fields).toEqual(emptyFields())
    expect(next.submission).toMatchObject({
      id: 'w1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      seats: 2,
      createdAt: 1_700_000_000_000
    })
  })

  it('rehydrates typed values on validation failure without writing', async () => {
    const next = await applyWaitlistSubmit(idle, toFormData({ name: '  ', seats: '3' }), store)
    expect(next.status).toBe('error')
    expect(next.fields).toMatchObject({ name: '  ', seats: '3' })
    expect(next.fieldErrors.name).toBeDefined()
    expect(next.submission).toBeNull()
  })

  it('keeps field values on simulated server rejection', async () => {
    const next = await applyWaitlistSubmit(idle, toFormData({ fail: true }), store, { fail: true })
    expect(next.status).toBe('error')
    expect(next.fields.name).toBe('Ada Lovelace')
    expect(next.fieldErrors).toEqual({})
    expect(next.formError).toMatch(/could not save/)
  })

  it('treats a thrown store as a form-level error and preserves input', async () => {
    const throwing = {
      submit(_data: ValidatedWaitlist): Promise<WaitlistSubmission> {
        return Promise.reject(new Error('disk full'))
      }
    }
    const next = await applyWaitlistSubmit(idle, toFormData(), throwing)
    expect(next.status).toBe('error')
    expect(next.fields.email).toBe('ada@example.com')
    expect(next.formError).toMatch(/went wrong/)
  })

  it('issues distinct ids across sequential successful submits', async () => {
    const fresh = createWaitlistStore({ clock: fixedClock, ids: sequentialIds() })
    const a = await applyWaitlistSubmit(idle, toFormData({ name: 'A' }), fresh)
    const b = await applyWaitlistSubmit(idle, toFormData({ name: 'B' }), fresh)
    expect(a.submission?.id).toBe('w1')
    expect(b.submission?.id).toBe('w2')
  })
})
