'use client'

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { createListItems, type ListItem } from '@/virtualization/items'
import { estimateMountCost } from '@/virtualization/range'
import { useVirtualList } from '@/virtualization/use-virtual-list'
import { token } from '@/tokens'

const ITEM_COUNT = 10_000
const ITEM_HEIGHT = 40
const VIEWPORT_HEIGHT = 320
const OVERSCAN = 4

const card: CSSProperties = {
  padding: token('space', '4'),
  border: '1px solid var(--color-border)',
  borderRadius: token('radius', 'md'),
  background: 'var(--color-surface)',
  display: 'grid',
  gap: token('space', '3')
}

const rowBase: CSSProperties = {
  height: ITEM_HEIGHT,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `0 ${token('space', '3')}`,
  borderBottom: '1px solid var(--color-border)',
  fontSize: token('fontSize', 'sm'),
  boxSizing: 'border-box'
}

const scroller: CSSProperties = {
  height: VIEWPORT_HEIGHT,
  overflow: 'auto',
  border: '1px solid var(--color-border)',
  borderRadius: token('radius', 'md'),
  background: 'var(--color-bg)'
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} style={card}>
      <h2 style={{ margin: 0, fontSize: token('fontSize', 'lg') }}>{title}</h2>
      {children}
    </section>
  )
}

function Stats({ mode, mounted, total }: { mode: string; mounted: number; total: number }) {
  const cost = estimateMountCost(mounted)
  const full = estimateMountCost(total)
  const savings = full === 0 ? 0 : Math.round(((full - cost) / full) * 100)
  return (
    <p
      data-testid={`stats-${mode}`}
      style={{ margin: 0, fontSize: token('fontSize', 'sm'), fontFamily: 'var(--font-mono)', color: token('color', 'muted') }}
    >
      Mounted <span data-testid={`${mode}-mounted`}>{mounted.toLocaleString()} / {total.toLocaleString()}</span>
      {' · '}
      cost <span data-testid={`${mode}-cost`}>{cost.toLocaleString()}</span>
      {mode === 'virtual' ? ` (${savings}% less)` : ''}
    </p>
  )
}

function Row({ item }: { item: ListItem }) {
  return (
    <div role="row" data-testid="list-row" style={rowBase}>
      <span>
        <strong>{item.label}</strong>
        <span style={{ color: token('color', 'muted') }}> · {item.category}</span>
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', color: token('color', 'muted') }}>{item.score}</span>
    </div>
  )
}

function NaiveList({ items }: { items: readonly ListItem[] }) {
  return (
    <Panel title="Naive: mount every row">
      <Stats mode="naive" mounted={items.length} total={items.length} />
      <div role="list" aria-label="Naive list" data-testid="naive-list" style={scroller}>
        {items.map((item) => (
          <Row key={item.id} item={item} />
        ))}
      </div>
    </Panel>
  )
}

function VirtualList({ items }: { items: readonly ListItem[] }) {
  const { range, onScroll, scrollRef, spacerStyle, windowStyle } = useVirtualList({
    itemCount: items.length,
    itemHeight: ITEM_HEIGHT,
    viewportHeight: VIEWPORT_HEIGHT,
    overscan: OVERSCAN
  })
  const windowItems = items.slice(range.start, range.end)
  return (
    <Panel title="Virtualized: window + overscan">
      <Stats mode="virtual" mounted={range.mountedCount} total={items.length} />
      <div
        ref={scrollRef}
        role="list"
        aria-label="Virtualized list"
        data-testid="virtual-list"
        onScroll={onScroll}
        style={scroller}
      >
        <div style={spacerStyle}>
          <div style={windowStyle}>
            {windowItems.map((item) => (
              <Row key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
      <p data-testid="virtual-range" style={{ margin: 0, fontSize: token('fontSize', 'sm'), color: token('color', 'muted') }}>
        Window [{range.start}, {range.end}) · offset {range.offsetY}px · height {range.totalHeight.toLocaleString()}px
      </p>
    </Panel>
  )
}

export function VirtualizationDemo() {
  const [seed, setSeed] = useState(0)
  const items = useMemo(() => createListItems(ITEM_COUNT), [seed])
  return (
    <div style={{ display: 'grid', gap: token('space', '6'), marginTop: token('space', '8') }}>
      <p style={{ margin: 0, color: token('color', 'muted'), fontSize: token('fontSize', 'sm') }}>
        Same {ITEM_COUNT.toLocaleString()} rows, fixed {ITEM_HEIGHT}px height, {VIEWPORT_HEIGHT}px viewport.
        Naive mounts every node. Virtual mounts viewport + {OVERSCAN} overscan each side.
      </p>
      <div style={{ display: 'grid', gap: token('space', '4'), gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))' }}>
        <NaiveList items={items} />
        <VirtualList items={items} />
      </div>
      <button type="button" onClick={() => setSeed((s) => s + 1)}>
        Regenerate list
      </button>
    </div>
  )
}
