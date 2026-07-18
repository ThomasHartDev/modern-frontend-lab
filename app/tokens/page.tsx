import { tokens, token, type TokenGroup } from '@/tokens'

export const metadata = {
  title: 'Design tokens - Modern Frontend Lab'
}

function isColor(value: string): boolean {
  return value.startsWith('#')
}

export default function TokensPage() {
  const groups = Object.keys(tokens) as TokenGroup[]

  return (
    <main style={{ maxWidth: '52rem', margin: '0 auto', padding: token('space', '8') + ' ' + token('space', '4') }}>
      <h1>Design tokens</h1>
      <p style={{ color: token('color', 'muted') }}>
        Values come from one typed tree in <code>src/tokens</code>. The CSS custom properties below are generated from it and
        injected by the root layout, so the swatches and the rest of the app read the same source.
      </p>

      {groups.map((group) => {
        const scale = tokens[group] as Record<string, string>
        return (
          <section key={group} aria-label={group} style={{ marginTop: token('space', '8') }}>
            <h2 style={{ fontSize: token('fontSize', 'lg') }}>{group}</h2>
            <dl style={{ display: 'grid', gap: token('space', '2'), margin: 0 }}>
              {Object.entries(scale).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: token('space', '4') }}>
                  <span
                    aria-hidden
                    style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      borderRadius: token('radius', 'md'),
                      border: '1px solid var(--color-border)',
                      background: isColor(value) ? value : 'transparent',
                      flexShrink: 0
                    }}
                  />
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
