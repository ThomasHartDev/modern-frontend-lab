import { createLoader } from './loader'

export interface Profile {
  id: string
  name: string
  role: string
}

export interface ActivityFeed {
  items: readonly string[]
}

export interface Recommendation {
  id: string
  title: string
}

export class NotFoundError extends Error {
  constructor(
    readonly kind: string,
    readonly key: string
  ) {
    super(`${kind} not found: ${key}`)
    this.name = 'NotFoundError'
  }
}

// Latencies are staggered so the route visibly streams out of order: the shell
// paints, then each boundary flushes as its own fetch settles, fastest first.
export const LATENCY = {
  profile: 120,
  activity: 640,
  recommendations: 340
} as const

const PROFILES: Readonly<Record<string, Profile>> = {
  u1: { id: 'u1', name: 'Ada Lovelace', role: 'Analyst' },
  u2: { id: 'u2', name: 'Grace Hopper', role: 'Compiler engineer' }
}

const FEEDS: Readonly<Record<string, ActivityFeed>> = {
  u1: { items: ['Opened issue #204', 'Merged the notes engine', 'Reviewed 3 PRs'] },
  u2: { items: ['Shipped the linker', 'Coined "debugging"'] }
}

const RECOMMENDATIONS: readonly Recommendation[] = [
  { id: 'r1', title: 'Streaming SSR in depth' },
  { id: 'r2', title: 'When Suspense stops paying off' },
  { id: 'r3', title: 'Request-scoped caching patterns' }
]

export type Wait = (ms: number) => Promise<void>

const realWait: Wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export interface DataStore {
  profile(id: string): Promise<Profile>
  activity(id: string): Promise<ActivityFeed>
  recommendations(): Promise<readonly Recommendation[]>
}

// One store per render pass keeps the memoization request-scoped: a module-level
// cache would leak one request's data into the next. Tests pass a zero-latency
// `wait` to stay fast and deterministic without fake timers.
export function createDataStore(wait: Wait = realWait): DataStore {
  const profiles = createLoader<string, Profile>(async (id) => {
    await wait(LATENCY.profile)
    const found = PROFILES[id]
    if (found === undefined) throw new NotFoundError('profile', id)
    return found
  })

  const feeds = createLoader<string, ActivityFeed>(async (id) => {
    await wait(LATENCY.activity)
    const found = FEEDS[id]
    if (found === undefined) throw new NotFoundError('activity', id)
    return found
  })

  const recs = createLoader<'all', readonly Recommendation[]>(async () => {
    await wait(LATENCY.recommendations)
    return RECOMMENDATIONS
  })

  return {
    profile: (id) => profiles.load(id),
    activity: (id) => feeds.load(id),
    recommendations: () => recs.load('all')
  }
}
