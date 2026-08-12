import { tokens, type TokenGroup, type TokenKey } from './tokens'

export { tokens } from './tokens'
export type { Tokens, TokenGroup, TokenKey } from './tokens'

type TokenTree = Readonly<Record<string, Readonly<Record<string, string>>>>

function toKebab(input: string): string {
  return input.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

function varName(group: string, key: string): string {
  return `--${toKebab(group)}-${toKebab(key)}`
}

export function cssVarName<G extends TokenGroup>(group: G, key: TokenKey<G>): string {
  return varName(group, key)
}

export function token<G extends TokenGroup>(group: G, key: TokenKey<G>): string {
  return `var(${cssVarName(group, key)})`
}

export function tokensToCssVariables(source: TokenTree = tokens): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [group, scale] of Object.entries(source)) {
    for (const [key, value] of Object.entries(scale)) {
      out[varName(group, key)] = value
    }
  }
  return out
}

export function cssVariablesToRootRule(vars: Record<string, string>): string {
  const body = Object.entries(vars)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n')
  return `:root {\n${body}\n}`
}
