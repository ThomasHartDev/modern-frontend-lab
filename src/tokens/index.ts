import {
  colorThemes,
  DEFAULT_THEME,
  sharedTokens,
  THEME_NAMES,
  THEME_PREFERENCES,
  THEME_STORAGE_KEY,
  tokens,
  type ThemeName,
  type ThemePreference,
  type TokenGroup,
  type TokenKey
} from './tokens'

export {
  colorThemes,
  DEFAULT_THEME,
  sharedTokens,
  THEME_NAMES,
  THEME_PREFERENCES,
  THEME_STORAGE_KEY,
  tokens
}
export type {
  ColorRole,
  ThemeName,
  ThemePreference,
  TokenGroup,
  TokenKey,
  Tokens
} from './tokens'

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

export function isThemeName(value: string): value is ThemeName {
  return (THEME_NAMES as readonly string[]).includes(value)
}

export function isThemePreference(value: string): value is ThemePreference {
  return (THEME_PREFERENCES as readonly string[]).includes(value)
}

export function parseThemePreference(raw: string | null | undefined): ThemePreference {
  if (typeof raw === 'string' && isThemePreference(raw)) return raw
  return 'system'
}

export function resolveTheme(preference: ThemePreference, system: ThemeName): ThemeName {
  return preference === 'system' ? system : preference
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

export function sharedToCssVariables(): Record<string, string> {
  return tokensToCssVariables(sharedTokens)
}

export function themeToCssVariables(theme: ThemeName): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(colorThemes[theme])) {
    out[varName('color', key)] = value
  }
  // Native controls follow color-scheme, not our --color-* roles.
  out['color-scheme'] = theme
  return out
}

function declarations(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n')
}

export function cssVariablesToRootRule(vars: Record<string, string>): string {
  return `:root {\n${declarations(vars)}\n}`
}

export function cssVariablesToSelectorRule(selector: string, vars: Record<string, string>): string {
  return `${selector} {\n${declarations(vars)}\n}`
}

export function themesToStyleSheet(defaultTheme: ThemeName = DEFAULT_THEME): string {
  const root = cssVariablesToRootRule({
    ...sharedToCssVariables(),
    ...themeToCssVariables(defaultTheme)
  })

  const explicit = THEME_NAMES.map((name) =>
    cssVariablesToSelectorRule(`[data-theme="${name}"]`, themeToCssVariables(name))
  )

  // data-theme unset = OS. :root holds defaultTheme; media rewrites the other side.
  const other: ThemeName = defaultTheme === 'dark' ? 'light' : 'dark'
  const system = [
    `@media (prefers-color-scheme: ${other}) {`,
    cssVariablesToSelectorRule(':root:not([data-theme])', themeToCssVariables(other)),
    '}'
  ].join('\n')

  return [root, ...explicit, system].join('\n\n')
}

export function applyThemeAttribute(root: HTMLElement, preference: ThemePreference): void {
  if (preference === 'system') {
    root.removeAttribute('data-theme')
    return
  }
  root.setAttribute('data-theme', preference)
}

// Blocking head script: apply stored light/dark before paint.
export function themeBootstrapScript(storageKey: string = THEME_STORAGE_KEY): string {
  const key = JSON.stringify(storageKey)
  return `(function(){try{var p=localStorage.getItem(${key});if(p==="light"||p==="dark")document.documentElement.setAttribute("data-theme",p);}catch(e){}})();`
}
