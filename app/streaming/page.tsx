import { Suspense } from 'react'
import { createDataStore } from '@/streaming/data'
import { token } from '@/tokens'
import { ActivityFeed, ProfileCard, Recommendations, Skeleton } from './cards'

export const metadata = {
  title: 'Server Components & streaming - Modern Frontend Lab'
}

const USER_ID = 'u1'

export default function StreamingPage() {
  // One store per request: the memoizing loaders inside it stay request-scoped.
  const store = createDataStore()

  return (
    <main style={{ maxWidth: '52rem', margin: '0 auto', padding: `${token('space', '8')} ${token('space', '4')}` }}>
      <h1>Server Components &amp; streaming</h1>
      <p style={{ color: token('color', 'muted'), marginTop: 0 }}>
        The page is a Server Component. Each card below is its own async Server Component behind a Suspense boundary, so the
        shell flushes immediately and every card streams in as its data settles, fastest first. None of these cards ship
        client JavaScript.
      </p>

      <div style={{ display: 'grid', gap: token('space', '4'), marginTop: token('space', '8') }}>
        <Suspense fallback={<Skeleton label="profile" lines={2} />}>
          <ProfileCard store={store} id={USER_ID} />
        </Suspense>
        <Suspense fallback={<Skeleton label="recommendations" lines={3} />}>
          <Recommendations store={store} />
        </Suspense>
        <Suspense fallback={<Skeleton label="activity" lines={3} />}>
          <ActivityFeed store={store} id={USER_ID} />
        </Suspense>
      </div>

      <section aria-label="Notes" style={{ marginTop: token('space', '8'), color: token('color', 'muted') }}>
        <h2 style={{ fontSize: token('fontSize', 'lg'), color: 'var(--color-text)' }}>Why this shape</h2>
        <p>
          Rendering blocks only where you await. Wrapping each slow read in its own boundary turns one all-or-nothing wait
          into three independent flushes, so a fast section never waits behind a slow one. The tradeoff is layout shift: a
          fallback that is not the same height as its content moves the page when it swaps, which hurts CLS. Size the
          skeletons to match, and do not over-split, since every boundary is a separate round of hydration work.
        </p>
      </section>
    </main>
  )
}
