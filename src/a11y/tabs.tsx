'use client'

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { nextRovingIndex, type RovingKey } from './roving'

export interface TabItem {
  id: string
  label: string
  panel: ReactNode
}

export interface TabsProps {
  items: readonly TabItem[]
  defaultIndex?: number
  label: string
}

const ROVING = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'])

export function Tabs({ items, defaultIndex = 0, label }: TabsProps) {
  const baseId = useId()
  const start = items.length === 0 ? 0 : Math.min(Math.max(defaultIndex, 0), items.length - 1)
  const [activeIndex, setActiveIndex] = useState(start)
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  if (items.length === 0) return <p role="status">No tabs</p>
  const active = items[activeIndex] ?? items[0]!

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!ROVING.has(event.key)) return
    event.preventDefault()
    const next = nextRovingIndex({
      length: items.length,
      current: activeIndex,
      key: event.key as RovingKey,
      orientation: 'horizontal',
      loop: true
    })
    setActiveIndex(next)
    refs.current[next]?.focus()
  }

return (
    <div data-testid="tabs-root">
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--color-border)' }}
      >
        {items.map((item, index) => {
          const selected = index === activeIndex
          return (
            <button
              key={item.id}
              ref={(el) => {
                refs.current[index] = el
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveIndex(index)}
              style={{
                appearance: 'none',
                border: 'none',
                background: 'transparent',
                color: selected ? 'var(--color-text)' : 'var(--color-muted)',
                borderBottom: selected ? '2px solid var(--color-accent)' : '2px solid transparent',
                padding: 'var(--space-2) var(--space-3)',
                cursor: 'pointer',
                font: 'inherit'
              }}
            >
              {item.label}
            </button>
          )
        })}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-panel-${active.id}`}
        aria-labelledby={`${baseId}-tab-${active.id}`}
        tabIndex={0}
        style={{ paddingTop: 'var(--space-4)' }}
        data-testid="tab-panel"
      >
        {active.panel}
      </div>
    </div>
  )
}
