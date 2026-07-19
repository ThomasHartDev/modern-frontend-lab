import { createDataStore, LATENCY, NotFoundError, type Wait } from '@/streaming/data'

const instant: Wait = () => Promise.resolve()

describe('createDataStore', () => {
  it('reads seeded records', async () => {
    const store = createDataStore(instant)
    const profile = await store.profile('u1')
    expect(profile.name).toBe('Ada Lovelace')
    const feed = await store.activity('u1')
    expect(feed.items).toHaveLength(3)
    const recs = await store.recommendations()
    expect(recs.map((r) => r.id)).toEqual(['r1', 'r2', 'r3'])
  })

  it('dedupes repeated reads of the same key within one store', async () => {
    let waits = 0
    const counting: Wait = async () => {
      waits += 1
    }
    const store = createDataStore(counting)

    await Promise.all([store.profile('u1'), store.profile('u1'), store.recommendations()])
    // Two distinct resources touched, so exactly two underlying reads.
    expect(waits).toBe(2)
  })

  it('does not share cache across stores', async () => {
    let waits = 0
    const counting: Wait = async () => {
      waits += 1
    }
    await createDataStore(counting).profile('u1')
    await createDataStore(counting).profile('u1')
    expect(waits).toBe(2)
  })

  it('throws a typed NotFoundError for an unknown key', async () => {
    const store = createDataStore(instant)
    await expect(store.profile('nobody')).rejects.toBeInstanceOf(NotFoundError)
    await expect(store.activity('nobody')).rejects.toThrow('activity not found: nobody')
  })

  it('settles boundaries fastest-first, which is the streaming order', async () => {
    vi.useFakeTimers()
    try {
      const store = createDataStore()
      const order: string[] = []
      store.profile('u1').then(() => order.push('profile'))
      store.activity('u1').then(() => order.push('activity'))
      store.recommendations().then(() => order.push('recommendations'))

      await vi.advanceTimersByTimeAsync(Math.max(LATENCY.profile, LATENCY.activity, LATENCY.recommendations))
      expect(order).toEqual(['profile', 'recommendations', 'activity'])
    } finally {
      vi.useRealTimers()
    }
  })
})
