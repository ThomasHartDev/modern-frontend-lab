import {
  cssVarName,
  cssVariablesToRootRule,
  token,
  tokens,
  tokensToCssVariables
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
