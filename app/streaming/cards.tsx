import { type DataStore } from '@/streaming/data'
import { token } from '@/tokens'

const cardStyle: React.CSSProperties = {
  padding: token('space', '6'),
  border: '1px solid var(--color-border)',
  borderRadius: token('radius', 'md'),
  background: 'var(--color-surface)'
}

export async function ProfileCard({ store, id }: { store: DataStore; id: string }) {
  const profile = await store.profile(id)
  return (
    <section aria-label="Profile" style={cardStyle}>
      <h2 style={{ margin: 0, fontSize: token('fontSize', 'lg') }}>{profile.name}</h2>
      <p style={{ margin: `${token('space', '2')} 0 0`, color: token('color', 'muted') }}>{profile.role}</p>
    </section>
  )
}

export async function Recommendations({ store }: { store: DataStore }) {
  const items = await store.recommendations()
  return (
    <section aria-label="Recommendations" style={cardStyle}>
      <h2 style={{ margin: 0, fontSize: token('fontSize', 'lg') }}>Recommended reading</h2>
      <ul style={{ margin: `${token('space', '3')} 0 0`, paddingLeft: token('space', '6') }}>
        {items.map((item) => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    </section>
  )
}

export async function ActivityFeed({ store, id }: { store: DataStore; id: string }) {
  const feed = await store.activity(id)
  return (
    <section aria-label="Activity" style={cardStyle}>
      <h2 style={{ margin: 0, fontSize: token('fontSize', 'lg') }}>Recent activity</h2>
      <ol style={{ margin: `${token('space', '3')} 0 0`, paddingLeft: token('space', '6') }}>
        {feed.items.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
    </section>
  )
}

export function Skeleton({ label, lines }: { label: string; lines: number }) {
  return (
    <div role="status" aria-label={`Loading ${label}`} aria-busy style={{ ...cardStyle, display: 'grid', gap: token('space', '3') }}>
      {Array.from({ length: lines }, (_, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            height: '0.9rem',
            width: i === 0 ? '55%' : '85%',
            borderRadius: token('radius', 'md'),
            background: 'var(--color-border)'
          }}
        />
      ))}
    </div>
  )
}
