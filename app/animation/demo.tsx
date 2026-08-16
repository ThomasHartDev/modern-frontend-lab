'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import { estimateFrameCost, isCompositorSafe, resolveMotionPolicy } from '@/animation/motion'
import { useFlip } from '@/animation/use-flip'
import { token } from '@/tokens'

interface Tile {
  id: string
  label: string
  hue: number
}

const LABELS = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'] as const

function createTiles(count = 8): Tile[] {
  const n = Math.max(0, Math.floor(count))
  return Array.from({ length: n }, (_, i) => ({
    id: `tile-${i}`,
    label: LABELS[i % LABELS.length] ?? `Item ${i + 1}`,
    hue: (i * 37) % 360
  }))
}

export function shuffleTiles(tiles: readonly Tile[], seed: number): Tile[] {
  const next = tiles.slice()
  let state = seed >>> 0
  for (let i = next.length - 1; i > 0; i--) {
    state = (state * 1664525 + 1013904223) >>> 0
    const j = state % (i + 1)
    const a = next[i]
    const b = next[j]
    if (a === undefined || b === undefined) continue
    next[i] = b
    next[j] = a
  }
  return next
}

const card: CSSProperties = {
  padding: token('space', '4'),
  border: '1px solid var(--color-border)',
  borderRadius: token('radius', 'md'),
  background: 'var(--color-surface)',
  display: 'grid',
  gap: token('space', '3')
}

function CostRow({ label, props }: { label: string; props: readonly string[] }) {
  const safe = isCompositorSafe(props)
  return (
    <div data-testid={`cost-${label}`} style={{ display: 'flex', justifyContent: 'space-between', gap: token('space', '3'), fontSize: token('fontSize', 'sm'), fontFamily: 'var(--font-mono)' }}>
      <span>{label}: {props.join(', ')}</span>
      <span data-testid={`cost-${label}-value`} style={{ color: safe ? token('color', 'accent') : token('color', 'muted') }}>
        cost {estimateFrameCost(props)}{safe ? ' · compositor' : ' · layout/paint'}
      </span>
    </div>
  )
}

function FlipGrid({ tiles, forceReduced }: { tiles: readonly Tile[]; forceReduced: boolean }) {
  const ids = useMemo(() => tiles.map((t) => t.id), [tiles])
  const motionOpts = forceReduced
    ? { prefersReducedMotion: true as const, durationMs: 320 }
    : { durationMs: 320 }
  const { register } = useFlip({ ids, ...motionOpts })
  const policy = resolveMotionPolicy(motionOpts)
  return (
    <section aria-label="FLIP reorder demo" style={card}>
      <h2 style={{ margin: 0, fontSize: token('fontSize', 'lg') }}>FLIP reorder</h2>
      <p data-testid="motion-policy" style={{ margin: 0, fontSize: token('fontSize', 'sm'), color: token('color', 'muted') }}>
        Motion: {policy.animate ? `${policy.durationMs}ms transform` : 'instant (reduced-motion)'}
      </p>
      <div data-testid="flip-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: token('space', '3') }}>
        {tiles.map((tile) => (
          <div
            key={tile.id}
            ref={(el) => register(tile.id, el)}
            data-testid={`tile-${tile.id}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '4.5rem',
              borderRadius: token('radius', 'md'), fontWeight: 600, fontSize: token('fontSize', 'sm'),
              color: '#0f1115', willChange: 'transform', background: `hsl(${tile.hue} 70% 72%)`
            }}
          >
            {tile.label}
          </div>
        ))}
      </div>
    </section>
  )
}

export function AnimationDemo() {
  const [seed, setSeed] = useState(1)
  const [forceReduced, setForceReduced] = useState(false)
  const base = useMemo(() => createTiles(8), [])
  const tiles = useMemo(() => shuffleTiles(base, seed), [base, seed])
  return (
    <div style={{ display: 'grid', gap: token('space', '6'), marginTop: token('space', '8') }}>
      <p style={{ margin: 0, color: token('color', 'muted'), fontSize: token('fontSize', 'sm') }}>
        Shuffle reorders the same tiles via FLIP: invert with transform, play back to identity.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: token('space', '3'), alignItems: 'center' }}>
        <button type="button" data-testid="shuffle" onClick={() => setSeed((s) => s + 1)}>Shuffle</button>
        <label style={{ display: 'inline-flex', gap: token('space', '2'), alignItems: 'center', fontSize: token('fontSize', 'sm') }}>
          <input type="checkbox" data-testid="reduced-toggle" checked={forceReduced} onChange={(e) => setForceReduced(e.target.checked)} />
          Force reduced motion
        </label>
      </div>
      <FlipGrid tiles={tiles} forceReduced={forceReduced} />
      <section aria-label="Property cost comparison" style={card}>
        <h2 style={{ margin: 0, fontSize: token('fontSize', 'lg') }}>What to animate</h2>
        <CostRow label="good" props={['transform', 'opacity']} />
        <CostRow label="bad" props={['top', 'left', 'width']} />
      </section>
    </div>
  )
}
