'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import { DEFAULT_BUDGET, evaluateBudget, projectRoute, type RoutePattern } from '@/cwv'
import { token } from '@/tokens'

const card: CSSProperties = {
  padding: token('space', '4'),
  border: '1px solid var(--color-border)',
  borderRadius: token('radius', 'md'),
  background: 'var(--color-surface)',
  display: 'grid',
  gap: token('space', '3')
}

function PatternPanel({ pattern }: { pattern: RoutePattern }) {
  const projection = useMemo(() => projectRoute(pattern), [pattern])
  const report = useMemo(() => evaluateBudget(projection.samples, DEFAULT_BUDGET), [projection])
  const reserved = pattern === 'fixed'
  const title = pattern === 'slow' ? 'Slow route (before)' : 'Fixed route (after)'

  return (
    <section aria-label={title} style={card}>
      <h2 style={{ margin: 0, fontSize: token('fontSize', 'lg') }}>{title}</h2>
      <p
        data-testid={`${pattern}-verdict`}
        style={{
          margin: 0,
          fontFamily: 'var(--font-mono)',
          fontSize: token('fontSize', 'sm'),
          color: report.pass ? token('color', 'accent') : token('color', 'muted')
        }}
      >
        Budget {report.pass ? 'PASS' : 'FAIL'}
      </p>
      <div
        data-testid={reserved ? 'hero-fixed' : 'hero-slow'}
        style={{ border: '1px dashed var(--color-border)', borderRadius: token('radius', 'md'), overflow: 'hidden' }}
      >
        <div
          aria-hidden
          style={
            reserved
              ? { aspectRatio: '3 / 2', background: 'linear-gradient(135deg, #2a3344, #1a2030)' }
              : { height: 120, background: 'linear-gradient(135deg, #2a3344, #1a2030)' }
          }
        />
        <p style={{ margin: 0, padding: token('space', '3'), fontSize: token('fontSize', 'sm'), color: token('color', 'muted') }}>
          {reserved ? 'aspect-ratio reserves space before bytes arrive.' : 'No size → layout jumps on image load (CLS).'}
        </p>
      </div>
      <table data-testid={`budget-${pattern}`} style={{ width: '100%', borderCollapse: 'collapse', fontSize: token('fontSize', 'sm'), fontFamily: 'var(--font-mono)' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: token('color', 'muted') }}>
            <th scope="col">Metric</th>
            <th scope="col">Value</th>
            <th scope="col">Budget</th>
            <th scope="col">Rating</th>
          </tr>
        </thead>
        <tbody>
          {report.metrics.map((m) => (
            <tr key={m.name} data-testid={`${pattern}-${m.name}`}>
              <td>{m.name}</td>
              <td data-testid={`${pattern}-${m.name}-value`}>
                {m.value === null ? '—' : m.name === 'CLS' ? m.value.toFixed(3) : `${Math.round(m.value)}ms`}
              </td>
              <td>{m.name === 'CLS' ? m.budget : `${m.budget}ms`}</td>
              <td data-testid={`${pattern}-${m.name}-rating`} style={{ color: m.withinBudget ? token('color', 'accent') : 'var(--color-text)' }}>
                {m.rating}
                {m.withinBudget ? ' · pass' : ' · fail'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function InteractionProbe() {
  const [ms, setMs] = useState<number | null>(null)
  const [mode, setMode] = useState<'sync' | 'deferred'>('sync')

  function onClick() {
    const work = () => {
      let x = 0
      for (let i = 0; i < 4_000_000; i++) x = (x + i) % 97
      void x
    }
    if (mode === 'sync') {
      const t0 = performance.now()
      work()
      setMs(performance.now() - t0)
      return
    }
    queueMicrotask(() => {
      requestAnimationFrame(() => {
        const t0 = performance.now()
        work()
        setMs(performance.now() - t0)
      })
    })
  }

  return (
    <section aria-label="Interaction probe" style={card}>
      <h2 style={{ margin: 0, fontSize: token('fontSize', 'lg') }}>INP probe</h2>
      <p style={{ margin: 0, color: token('color', 'muted'), fontSize: token('fontSize', 'sm') }}>
        Same work, two schedules. Sync blocks paint; deferred yields a frame first.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: token('space', '3'), alignItems: 'center' }}>
        <label style={{ fontSize: token('fontSize', 'sm') }}>
          <input type="radio" name="inp-mode" checked={mode === 'sync'} onChange={() => setMode('sync')} /> Sync handler
        </label>
        <label style={{ fontSize: token('fontSize', 'sm') }}>
          <input type="radio" name="inp-mode" checked={mode === 'deferred'} onChange={() => setMode('deferred')} /> Deferred past paint
        </label>
        <button type="button" data-testid="inp-run" onClick={onClick}>
          Run work
        </button>
        <span data-testid="inp-ms" style={{ fontFamily: 'var(--font-mono)', fontSize: token('fontSize', 'sm') }}>
          {ms === null ? '—' : `${ms.toFixed(1)}ms work`}
        </span>
      </div>
    </section>
  )
}

export function CwvDemo() {
  return (
    <div style={{ display: 'grid', gap: token('space', '6'), marginTop: token('space', '8') }}>
      <div style={{ display: 'grid', gap: token('space', '4'), gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))' }}>
        <PatternPanel pattern="slow" />
        <PatternPanel pattern="fixed" />
      </div>
      <InteractionProbe />
    </div>
  )
}
