export type Fetcher<K, V> = (key: K) => Promise<V>

export interface Loader<K, V> {
  load(key: K): Promise<V>
  keys(): readonly K[]
}

// request-scoped memo like React cache(): concurrent reads share one promise

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
