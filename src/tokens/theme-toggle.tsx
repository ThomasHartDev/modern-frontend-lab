'use client'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import {
  applyThemeAttribute,
  parseThemePreference,
  resolveTheme,
  THEME_PREFERENCES,
  THEME_STORAGE_KEY,
  token,
  type ThemeName,
  type ThemePreference
} from '@/tokens'

function readStoredPreference(): ThemePreference {
  try {
    return parseThemePreference(localStorage.getItem(THEME_STORAGE_KEY))
  } catch {
    return 'system'
  }
}

function getSystemTheme(): ThemeName {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function persistPreference(preference: ThemePreference): void {
  try {
    if (preference === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
    else localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    /* private mode: attribute still updates in-memory */
  }
}

const row: CSSProperties = {
  display: 'inline-flex',
  flexWrap: 'wrap',
  gap: token('space', '2'),
  alignItems: 'center'
}

function btn(active: boolean): CSSProperties {
  return {
    appearance: 'none',
    border: `1px solid ${token('color', 'border')}`,
    borderRadius: token('radius', 'md'),
    background: active ? token('color', 'accent') : token('color', 'surface'),
    color: active ? token('color', 'bg') : token('color', 'text'),
    padding: `${token('space', '2')} ${token('space', '3')}`,
    fontSize: token('fontSize', 'sm'),
    cursor: 'pointer',
    textTransform: 'capitalize'
  }
}

export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>('system')
  const [resolved, setResolved] = useState<ThemeName>('dark')

  useEffect(() => {
    const pref = readStoredPreference()
    setPreference(pref)
    applyThemeAttribute(document.documentElement, pref)
    setResolved(resolveTheme(pref, getSystemTheme()))

    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      setPreference((current) => {
        if (current === 'system') setResolved(resolveTheme('system', getSystemTheme()))
        return current
      })
    }
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  const choose = useCallback((next: ThemePreference) => {
    setPreference(next)
    persistPreference(next)
    applyThemeAttribute(document.documentElement, next)
    setResolved(resolveTheme(next, getSystemTheme()))
  }, [])

  return (
    <div style={row}>
      <div role="group" aria-label="Color theme" style={row}>
        {THEME_PREFERENCES.map((pref) => (
          <button
            key={pref}
            type="button"
            aria-pressed={preference === pref}
            onClick={() => choose(pref)}
            style={btn(preference === pref)}
          >
            {pref}
          </button>
        ))}
      </div>
      <span style={{ color: token('color', 'muted'), fontSize: token('fontSize', 'sm') }}>
        Resolved: <strong style={{ color: token('color', 'text') }}>{resolved}</strong>
      </span>
    </div>
  )
}
