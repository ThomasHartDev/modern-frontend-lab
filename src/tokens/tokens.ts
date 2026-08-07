export const THEME_NAMES = ['light', 'dark'] as const
export type ThemeName = (typeof THEME_NAMES)[number]

export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const
export type ThemePreference = (typeof THEME_PREFERENCES)[number]

export const THEME_STORAGE_KEY = 'mfl-theme'
export const DEFAULT_THEME: ThemeName = 'dark'

// Semantic roles (bg, text, …) map per theme. Components bind to roles, never hex.
export const colorThemes = {
  light: {
    bg: '#f4f5f7',
    surface: '#ffffff',
    border: '#d5dae3',
    text: '#12151c',
    muted: '#5b6472',
    accent: '#0f766e',
    danger: '#dc2626'
  },
  dark: {
    bg: '#0f1115',
    surface: '#171a21',
    border: '#262b36',
    text: '#e7eaf0',
    muted: '#9aa3b2',
    accent: '#5eead4',
    danger: '#f87171'
  }
} as const satisfies Record<ThemeName, Readonly<Record<string, string>>>

export type ColorRole = keyof (typeof colorThemes)['light']

export const sharedTokens = {
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

// Shape for token() generics. Runtime --color-* comes from themesToStyleSheet.
export const tokens = {
  color: colorThemes.dark,
  ...sharedTokens
} as const

export type Tokens = typeof tokens
export type TokenGroup = keyof Tokens
export type TokenKey<G extends TokenGroup> = keyof Tokens[G] & string
