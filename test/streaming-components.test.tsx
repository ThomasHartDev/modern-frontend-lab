import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'
import { ActivityFeed, ProfileCard, Recommendations } from '../app/streaming/cards'
import { createDataStore, type Wait } from '@/streaming/data'

const instant: Wait = () => Promise.resolve()

// An async Server Component is just `async () => ReactElement`. Awaiting it and
// rendering the resolved element proves the component fetched and mapped real
// data, without needing a running Next server.
async function renderServer(node: Promise<ReactElement>): Promise<string> {
  return renderToStaticMarkup(await node)
}

describe('streaming server components', () => {
  it('ProfileCard renders the fetched profile', async () => {
    const store = createDataStore(instant)
    const html = await renderServer(ProfileCard({ store, id: 'u1' }))
    expect(html).toContain('Ada Lovelace')
    expect(html).toContain('Analyst')
  })

  it('Recommendations lists every item', async () => {
    const store = createDataStore(instant)
    const html = await renderServer(Recommendations({ store }))
    expect(html).toContain('Streaming SSR in depth')
    expect((html.match(/<li>/g) ?? [])).toHaveLength(3)
  })

  it('ActivityFeed renders the feed in order', async () => {
    const store = createDataStore(instant)
    const html = await renderServer(ActivityFeed({ store, id: 'u1' }))
    const first = html.indexOf('Opened issue #204')
    const last = html.indexOf('Reviewed 3 PRs')
    expect(first).toBeGreaterThan(-1)
    expect(last).toBeGreaterThan(first)
  })

  it('propagates a missing-record error to the boundary', async () => {
    const store = createDataStore(instant)
    await expect(ProfileCard({ store, id: 'ghost' })).rejects.toThrow('profile not found: ghost')
  })
})
