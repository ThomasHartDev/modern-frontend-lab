// The single origin for design values. Every CSS custom property and every
// token() reference is derived from this tree, so there is nowhere else to
// drift out of sync.
export const tokens = {
  color: {
    bg: '#0f1115',
    surface: '#171a21',
    border: '#262b36',
    text: '#e7eaf0',
    muted: '#9aa3b2',
    accent: '#5eead4'
  },
  space: {
    '2': '0.5rem',
    '3': '0.75rem',
    '4': '1rem',
    '6': '1.5rem',
    '8': '2rem'
  },
  radius: {
    md: '12px'
  },
  fontSize: {
    sm: '0.8rem',
    base: '1rem',
    lg: '1.05rem',
    xl: '1.5rem'
  }
} as const

export type Tokens = typeof tokens
export type TokenGroup = keyof Tokens
export type TokenKey<G extends TokenGroup> = keyof Tokens[G] & string
