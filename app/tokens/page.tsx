import {
  colorThemes,
  sharedTokens,
  token,
  THEME_NAMES,
  type ColorRole,
  type ThemeName
} from '@/tokens'
import { ThemeToggle } from '@/tokens/theme-toggle'

export const metadata = {
  title: 'Design tokens - Modern Frontend Lab'
}

const colorRoles = Object.keys(colorThemes.dark) as ColorRole[]

function ThemePalette({ theme }: { theme: ThemeName }) {
  const scale = colorThemes[theme]
  return (
    <section aria-label={`${theme} theme colors`} style={{ marginTop: token('space', '4') }}>
      <h3 style={{ fontSize: token('fontSize', 'base'), textTransform: 'capitalize', margin: 0 }}>{theme}</h3>
      <dl style={{ display: 'grid', gap: token('space', '2'), margin: `${token('space', '3')} 0 0` }}>
        {colorRoles.map((role) => (
          <div key={role} style={{ display: 'flex', alignItems: 'center', gap: token('space', '4') }}>
            <span
              aria-hidden
              style={{
                width: '1.5rem',
                height: '1.5rem',
                borderRadius: token('radius', 'md'),
                border: `1px solid ${token('color', 'border')}`,
                background: scale[role],
                flexShrink: 0
              }}
            />
            <dt style={{ fontFamily: 'var(--font-mono)', minWidth: '10rem' }}>{`--color-${role}`}</dt>
            <dd style={{ margin: 0, color: token('color', 'muted') }}>{scale[role]}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export default function TokensPage() {
  return (
    <main style={{ maxWidth: '52rem', margin: '0 auto', padding: `${token('space', '8')} ${token('space', '4')}` }}>
      <h1>Design tokens & theming</h1>
      <p style={{ color: token('color', 'muted') }}>
        Shared scales and semantic color roles live in one typed tree. Light and dark only reassign{' '}
        <code>--color-*</code> on the document root.
      </p>

      <section
        aria-label="Theme control"
        style={{
          marginTop: token('space', '6'),
          padding: token('space', '4'),
          border: `1px solid ${token('color', 'border')}`,
          borderRadius: token('radius', 'md'),
          background: token('color', 'surface')
        }}
      >
        <h2 style={{ fontSize: token('fontSize', 'lg'), margin: `0 0 ${token('space', '3')}` }}>Theme</h2>
        <p style={{ color: token('color', 'muted'), margin: `0 0 ${token('space', '4')}`, fontSize: token('fontSize', 'sm') }}>
          Preference is stored in <code>localStorage</code>. A blocking head script applies light/dark before paint.
          <code> system</code> clears <code>data-theme</code> so <code>prefers-color-scheme</code> owns the palette.
        </p>
        <ThemeToggle />
      </section>

      <section aria-label="color" style={{ marginTop: token('space', '8') }}>
        <h2 style={{ fontSize: token('fontSize', 'lg') }}>color (semantic roles)</h2>
        {THEME_NAMES.map((theme) => (
          <ThemePalette key={theme} theme={theme} />
        ))}
      </section>

      {(Object.keys(sharedTokens) as (keyof typeof sharedTokens)[]).map((group) => {
        const scale = sharedTokens[group] as Record<string, string>
        return (
          <section key={group} aria-label={group} style={{ marginTop: token('space', '8') }}>
            <h2 style={{ fontSize: token('fontSize', 'lg') }}>{group}</h2>
            <dl style={{ display: 'grid', gap: token('space', '2'), margin: 0 }}>
              {Object.entries(scale).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: token('space', '4') }}>
                  <dt style={{ fontFamily: 'var(--font-mono)', minWidth: '10rem' }}>
                    {`--${group.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}-${key}`}
                  </dt>
                  <dd style={{ margin: 0, color: token('color', 'muted') }}>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )
      })}
    </main>
  )
}
