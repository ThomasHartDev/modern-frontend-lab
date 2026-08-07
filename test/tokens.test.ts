import {
  applyThemeAttribute,
  colorThemes,
  cssVarName,
  cssVariablesToRootRule,
  DEFAULT_THEME,
  parseThemePreference,
  resolveTheme,
  sharedToCssVariables,
  themeBootstrapScript,
  themesToStyleSheet,
  themeToCssVariables,
  token,
  tokens,
  tokensToCssVariables,
  THEME_STORAGE_KEY
} from '@/tokens'

describe('cssVarName', () => {
  it('kebab-cases the group and joins with the key', () => {
    expect(cssVarName('color', 'accent')).toBe('--color-accent')
    expect(cssVarName('fontSize', 'base')).toBe('--font-size-base')
  })

  it('leaves numeric-style keys intact', () => {
    expect(cssVarName('space', '2')).toBe('--space-2')
  })
})

describe('token', () => {
  it('wraps the variable name in a var() reference', () => {
    expect(token('color', 'accent')).toBe('var(--color-accent)')
    expect(token('radius', 'md')).toBe('var(--radius-md)')
  })
})

describe('tokensToCssVariables', () => {
  it('emits one entry per leaf and preserves the value', () => {
    const vars = tokensToCssVariables()
    const leafCount = Object.values(tokens).reduce((n, scale) => n + Object.keys(scale).length, 0)
    expect(Object.keys(vars)).toHaveLength(leafCount)
    expect(vars['--color-accent']).toBe(tokens.color.accent)
    expect(vars['--font-size-xl']).toBe(tokens.fontSize.xl)
  })

  it('accepts a custom token source', () => {
    const custom = { color: { brand: '#ff0000' } } as const
    expect(tokensToCssVariables(custom)).toEqual({ '--color-brand': '#ff0000' })
  })

  it('handles an empty group without emitting anything for it', () => {
    const custom = { color: {}, space: { '1': '4px' } } as const
    expect(tokensToCssVariables(custom)).toEqual({ '--space-1': '4px' })
  })
})

describe('cssVariablesToRootRule', () => {
  it('builds a :root block with every declaration', () => {
    const rule = cssVariablesToRootRule({ '--color-accent': '#5eead4', '--space-4': '1rem' })
    expect(rule).toBe(':root {\n  --color-accent: #5eead4;\n  --space-4: 1rem;\n}')
  })

  it('produces an empty-bodied block for no variables', () => {
    expect(cssVariablesToRootRule({})).toBe(':root {\n\n}')
  })

  it('round-trips the real token tree into a rule containing the accent color', () => {
    const rule = cssVariablesToRootRule(tokensToCssVariables())
    expect(rule).toContain('--color-accent: #5eead4;')
    expect(rule.startsWith(':root {')).toBe(true)
  })
})

describe('light/dark themes', () => {
  it('shares role keys and emits per-theme color vars plus color-scheme', () => {
    expect(Object.keys(colorThemes.light).sort()).toEqual(Object.keys(colorThemes.dark).sort())
    expect(colorThemes.light.bg).not.toBe(colorThemes.dark.bg)
    expect(themeToCssVariables('light')['--color-bg']).toBe(colorThemes.light.bg)
    expect(themeToCssVariables('dark')['color-scheme']).toBe('dark')
    expect(Object.keys(sharedToCssVariables()).some((k) => k.startsWith('--color-'))).toBe(false)
  })

  it('parses preferences and resolves system against the OS', () => {
    expect(parseThemePreference('light')).toBe('light')
    expect(parseThemePreference(null)).toBe('system')
    expect(parseThemePreference('nope')).toBe('system')
    expect(resolveTheme('system', 'light')).toBe('light')
    expect(resolveTheme('dark', 'light')).toBe('dark')
  })

  it('applies data-theme for explicit modes and clears it for system', () => {
    const root = document.createElement('html')
    applyThemeAttribute(root, 'light')
    expect(root.getAttribute('data-theme')).toBe('light')
    applyThemeAttribute(root, 'system')
    expect(root.hasAttribute('data-theme')).toBe(false)
  })

  it('builds a stylesheet with root, data-theme blocks, and system media query', () => {
    const sheet = themesToStyleSheet(DEFAULT_THEME)
    expect(sheet).toContain('[data-theme="light"]')
    expect(sheet).toContain('[data-theme="dark"]')
    expect(sheet).toContain('@media (prefers-color-scheme: light)')
    expect(sheet).toContain(':root:not([data-theme])')
    expect(themesToStyleSheet('light')).toContain('@media (prefers-color-scheme: dark)')
  })

  it('bootstrap script applies stored light/dark only', () => {
    const script = themeBootstrapScript()
    expect(script).toContain(THEME_STORAGE_KEY)
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    document.documentElement.removeAttribute('data-theme')
    new Function(script)()
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    localStorage.setItem(THEME_STORAGE_KEY, 'system')
    document.documentElement.removeAttribute('data-theme')
    new Function(script)()
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
    localStorage.removeItem(THEME_STORAGE_KEY)
  })
})
