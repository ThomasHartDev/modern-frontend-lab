export const NAME_MAX = 80
export const SEAT_MIN = 1
export const SEAT_MAX = 20

// Shape check only. Real delivery systems use a stricter parser.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type WaitlistFields = { name: string; email: string; seats: string; agree: boolean }
export type FieldErrors = Partial<Record<keyof WaitlistFields, string>>
export type ValidatedWaitlist = { name: string; email: string; seats: number }
export type ValidationResult =
  | { ok: true; data: ValidatedWaitlist }
  | { ok: false; fieldErrors: FieldErrors; formError: string }
export type WaitlistSubmission = ValidatedWaitlist & { id: string; createdAt: number }
export type WaitlistState = {
  status: 'idle' | 'error' | 'success'
  fields: WaitlistFields
  fieldErrors: FieldErrors
  formError: string | null
  submission: WaitlistSubmission | null
}

export function emptyFields(): WaitlistFields {
  return { name: '', email: '', seats: '1', agree: false }
}

export function initialWaitlistState(): WaitlistState {
  return { status: 'idle', fields: emptyFields(), fieldErrors: {}, formError: null, submission: null }
}


export function parseWaitlistForm(formData: FormData): WaitlistFields {
  return {
    name: String(formData.get('name') ?? ''),
    email: String(formData.get('email') ?? ''),
    seats: String(formData.get('seats') ?? ''),
    agree: formData.get('agree') === 'on' || formData.get('agree') === 'true'
  }
}

export function validateWaitlist(fields: WaitlistFields): ValidationResult {
  const fieldErrors: FieldErrors = {}

  const name = fields.name.trim()
  if (name.length === 0) fieldErrors.name = 'Name is required.'
  else if (name.length > NAME_MAX) fieldErrors.name = `Name must be ${NAME_MAX} characters or fewer.`

  const email = fields.email.trim().toLowerCase()
  if (email.length === 0) fieldErrors.email = 'Email is required.'
  else if (!EMAIL_RE.test(email)) fieldErrors.email = 'Enter a valid email address.'

  const seatsRaw = fields.seats.trim()
  let seats = 0
  if (seatsRaw.length === 0) fieldErrors.seats = 'Seats is required.'
  else if (!/^\d+$/.test(seatsRaw)) fieldErrors.seats = 'Seats must be a whole number.'
  else {
    seats = Number(seatsRaw)
    if (seats < SEAT_MIN || seats > SEAT_MAX) {
      fieldErrors.seats = `Seats must be between ${SEAT_MIN} and ${SEAT_MAX}.`
    }
  }

  if (!fields.agree) fieldErrors.agree = 'You must accept the terms.'

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, formError: 'Fix the highlighted fields and try again.' }
  }
  return { ok: true, data: { name, email, seats } }
}

export interface Clock {
  now(): number
}

export type IdGen = () => string

export interface WaitlistStore {
  submit(data: ValidatedWaitlist): Promise<WaitlistSubmission>
}

export function createWaitlistStore(opts: { clock?: Clock; ids?: IdGen } = {}): WaitlistStore {
  const clock = opts.clock ?? { now: () => Date.now() }
  const ids = opts.ids ?? (() => crypto.randomUUID())
  return {
    async submit(data) {
      return { ...data, id: ids(), createdAt: clock.now() }
    }
  }
}

// Server is the source of truth. On failure the raw field values come back so
// the form can rehydrate without losing what the user typed.
export async function applyWaitlistSubmit(
  _prev: WaitlistState,
  formData: FormData,
  store: WaitlistStore,
  opts: { fail?: boolean } = {}
): Promise<WaitlistState> {
  const fields = parseWaitlistForm(formData)
  const validation = validateWaitlist(fields)

  if (!validation.ok) {
    return { status: 'error', fields, fieldErrors: validation.fieldErrors, formError: validation.formError, submission: null }
  }
  if (opts.fail) {
    return {
      status: 'error',
      fields,
      fieldErrors: {},
      formError: 'The server could not save your registration. Try again.',
      submission: null
    }
  }
  try {
    const submission = await store.submit(validation.data)
    return { status: 'success', fields: emptyFields(), fieldErrors: {}, formError: null, submission }
  } catch {
    return { status: 'error', fields, fieldErrors: {}, formError: 'Something went wrong. Try again.', submission: null }
  }
}
