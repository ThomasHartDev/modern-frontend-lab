export type Fetcher<K, V> = (key: K) => Promise<V>

export interface Loader<K, V> {
  load(key: K): Promise<V>
  keys(): readonly K[]
}

// Request-scoped memoization, the same idea as React's `cache()`: several server
// components that ask for the same key during one render share a single fetch.
// The promise is stored, not the value, so concurrent reads dedupe before the
// first one has even resolved. A rejected promise stays cached too, matching
// `cache()` semantics, so a retry inside the same render fails the same way
// instead of hammering a flaky source.
export function createLoader<K, V>(fetcher: Fetcher<K, V>): Loader<K, V> {
  const inflight = new Map<K, Promise<V>>()

  return {
    load(key) {
      const existing = inflight.get(key)
      if (existing !== undefined) return existing
      const pending = fetcher(key)
      inflight.set(key, pending)
      return pending
    },
    keys: () => [...inflight.keys()]
  }
}
