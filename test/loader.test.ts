import { createLoader } from '@/streaming/loader'

describe('createLoader', () => {
  it('runs the fetcher once per key and reuses the same promise', () => {
    const calls: string[] = []
    const loader = createLoader<string, number>(async (key) => {
      calls.push(key)
      return key.length
    })

    const a1 = loader.load('ada')
    const a2 = loader.load('ada')

    expect(a1).toBe(a2)
    expect(calls).toEqual(['ada'])
  })

  it('dedupes concurrent reads before the first resolves', async () => {
    let resolved = 0
    const loader = createLoader<string, number>(
      (key) =>
        new Promise((resolve) => {
          queueMicrotask(() => {
            resolved += 1
            resolve(key.length)
          })
        })
    )

    const results = await Promise.all([loader.load('grace'), loader.load('grace'), loader.load('grace')])

    expect(results).toEqual([5, 5, 5])
    expect(resolved).toBe(1)
  })

  it('keeps distinct keys independent', () => {
    const loader = createLoader<string, number>(async (key) => key.length)
    expect(loader.load('a')).not.toBe(loader.load('bb'))
    expect(loader.keys()).toEqual(['a', 'bb'])
  })

  it('memoizes a rejection so a retry in the same pass fails identically', async () => {
    let attempts = 0
    const loader = createLoader<string, number>(async () => {
      attempts += 1
      throw new Error('flaky')
    })

    const first = loader.load('x')
    const second = loader.load('x')

    expect(first).toBe(second)
    await expect(first).rejects.toThrow('flaky')
    await expect(second).rejects.toThrow('flaky')
    expect(attempts).toBe(1)
  })

  it('starts empty', () => {
    const loader = createLoader<string, number>(async (key) => key.length)
    expect(loader.keys()).toEqual([])
  })
})
