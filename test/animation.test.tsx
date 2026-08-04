import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach } from 'vitest'
import {
  captureRects,
  computeFlipDelta,
  invertTransform,
  isNoopDelta,
  planFlip,
  rectFromDOMRect,
  type Rect
} from '@/animation/flip'
import {
  classifyProperty,
  estimateFrameCost,
  isCompositorSafe,
  readPrefersReducedMotion,
  resolveMotionPolicy,
  transitionFor
} from '@/animation/motion'
import { useFlip } from '@/animation/use-flip'
import { AnimationDemo, shuffleTiles } from '../app/animation/demo'

function rect(partial: Partial<Rect> & Pick<Rect, 'x' | 'y'>): Rect {
  return { width: 100, height: 40, ...partial }
}

describe('FLIP math', () => {
  it('inverts translate/scale, guards zero size, and plans shared ids', () => {
    const delta = computeFlipDelta(
      rect({ x: 10, y: 20, width: 100, height: 40 }),
      rect({ x: 60, y: 80, width: 200, height: 80 })
    )
    expect(delta).toEqual({ dx: -50, dy: -60, sx: 0.5, sy: 0.5 })
    expect(invertTransform(delta)).toBe('translate(-50px, -60px) scale(0.5, 0.5)')
    expect(
      computeFlipDelta(rect({ x: 0, y: 0, width: 50, height: 0 }), rect({ x: 0, y: 0, width: 0, height: 0 })).sx
    ).toBe(50)
    expect(isNoopDelta({ dx: 0, dy: 0, sx: 1, sy: 1 })).toBe(true)
    expect(isNoopDelta({ dx: 0.2, dy: -0.1, sx: 1, sy: 1 })).toBe(true)
    expect(isNoopDelta({ dx: 40, dy: 0, sx: 1, sy: 1 })).toBe(false)

    const first = new Map<string, Rect>([
      ['a', rect({ x: 0, y: 0 })],
      ['b', rect({ x: 100, y: 0 })],
      ['gone', rect({ x: 200, y: 0 })]
    ])
    const last = new Map<string, Rect>([
      ['a', rect({ x: 0, y: 0 })],
      ['b', rect({ x: 0, y: 100 })],
      ['new', rect({ x: 50, y: 50 })]
    ])
    const plan = planFlip(first, last)
    expect(plan.map((p) => p.id).sort()).toEqual(['a', 'b'])
    expect(plan.find((p) => p.id === 'a')?.noop).toBe(true)
    expect(plan.find((p) => p.id === 'b')?.delta).toEqual({ dx: 100, dy: -100, sx: 1, sy: 1 })
    expect(planFlip(new Map(), new Map())).toEqual([])
    expect(rectFromDOMRect({ x: 1, y: 2, width: 3, height: 4 })).toEqual({ x: 1, y: 2, width: 3, height: 4 })
    const el = { getBoundingClientRect: () => ({ x: 5, y: 6, width: 7, height: 8 }) } as unknown as Element
    expect(captureRects(new Map([['k', el]])).get('k')).toEqual({ x: 5, y: 6, width: 7, height: 8 })
  })
})

describe('motion + compositor cost', () => {
  it('zeros duration under reduced motion; scores layout above transform', () => {
    expect(resolveMotionPolicy({ prefersReducedMotion: true, durationMs: 300 })).toMatchObject({
      animate: false,
      durationMs: 0
    })
    expect(resolveMotionPolicy({ prefersReducedMotion: false, durationMs: 0 }).animate).toBe(false)
    expect(resolveMotionPolicy({ prefersReducedMotion: false, durationMs: Number.NaN }).animate).toBe(false)
    const policy = resolveMotionPolicy({ prefersReducedMotion: false, durationMs: 200 })
    expect(transitionFor('transform', policy)).toBe('transform 200ms cubic-bezier(0.22, 1, 0.36, 1)')
    expect(transitionFor('transform', resolveMotionPolicy({ prefersReducedMotion: true }))).toBe('none')
    expect(readPrefersReducedMotion({ matches: true })).toBe(true)
    expect(readPrefersReducedMotion(null)).toBe(false)
    expect(classifyProperty('transform')).toBe('compositor')
    expect(classifyProperty('top')).toBe('layout')
    expect(classifyProperty('color')).toBe('paint')
    expect(isCompositorSafe(['transform', 'opacity'])).toBe(true)
    expect(isCompositorSafe(['transform', 'top'])).toBe(false)
    expect(isCompositorSafe([])).toBe(false)
    expect(estimateFrameCost(['transform', 'opacity'])).toBe(2)
    expect(estimateFrameCost(['top', 'left', 'width'])).toBe(300)
  })
})

describe('shuffleTiles', () => {
  it('is deterministic and preserves membership', () => {
    const tiles = [
      { id: 'tile-0', label: 'Alpha', hue: 0 },
      { id: 'tile-1', label: 'Bravo', hue: 37 },
      { id: 'tile-2', label: 'Charlie', hue: 74 }
    ]
    expect(shuffleTiles(tiles, 7)).toEqual(shuffleTiles(tiles, 7))
    expect(shuffleTiles(tiles, 7).map((t) => t.id).sort()).toEqual(['tile-0', 'tile-1', 'tile-2'])
    expect(shuffleTiles([], 1)).toEqual([])
  })
})

type Box = { x: number; y: number; width: number; height: number }

/** Captures style at the invert reflow (getBoundingClientRect while transform is non-empty). */
const invertSnapshots = new Map<string, { transform: string; origin: string }>()

function mockRect(box: Box): DOMRect {
  return {
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    top: box.y,
    left: box.x,
    right: box.x + box.width,
    bottom: box.y + box.height,
    toJSON: () => ({})
  } as DOMRect
}

function FlipHarness({
  order,
  prefersReducedMotion,
  boxes
}: {
  order: readonly string[]
  /** When omitted, useFlip falls through to the OS media query. */
  prefersReducedMotion?: boolean
  boxes?: ReadonlyMap<string, Box>
}) {
  const flipOpts =
    prefersReducedMotion === undefined
      ? { ids: order, durationMs: 200 }
      : { ids: order, durationMs: 200, prefersReducedMotion }
  const { register } = useFlip(flipOpts)
  return (
    <div>
      {order.map((id, index) => {
        const box = boxes?.get(id) ?? { x: index * 100, y: 0, width: 100, height: 40 }
        return (
          <div
            key={id}
            ref={(el) => {
              if (el !== null) {
                el.getBoundingClientRect = () => {
                  if (el.style.transform) {
                    invertSnapshots.set(id, {
                      transform: el.style.transform,
                      origin: el.style.transformOrigin
                    })
                  }
                  return mockRect(box)
                }
              }
              register(id, el)
            }}
            data-testid={`el-${id}`}
          />
        )
      })}
    </div>
  )
}

function mockMatchMedia(reduced: boolean) {
  window.matchMedia = ((query: string) =>
    ({
      matches: reduced && query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    }) as MediaQueryList) as typeof window.matchMedia
}

describe('useFlip + demo', () => {
  afterEach(() => {
    invertSnapshots.clear()
  })

  it('transitions transform on reorder; instant under forced reduced motion', () => {
    const { rerender } = render(<FlipHarness order={['a', 'b']} prefersReducedMotion={false} />)
    const elA = screen.getByTestId('el-a')
    const elB = screen.getByTestId('el-b')
    rerender(<FlipHarness order={['b', 'a']} prefersReducedMotion={false} />)
    expect(elA.style.transition).toContain('transform')
    expect(elA.style.transform).toBe('')
    expect(elB.style.transition).toContain('transform')
    rerender(<FlipHarness order={['a', 'b']} prefersReducedMotion />)
    expect(elA.style.transition).toBe('none')
    expect(elB.style.transition).toBe('none')
  })

  it('sets transform-origin 0 0 and applies scale invert when size changes', () => {
    const firstBoxes = new Map<string, Box>([
      ['a', { x: 0, y: 0, width: 100, height: 40 }],
      ['b', { x: 100, y: 0, width: 100, height: 40 }]
    ])
    // Different last geometry for a (position + size) so invert includes scale.
    const lastBoxes = new Map<string, Box>([
      ['a', { x: 50, y: 50, width: 200, height: 80 }],
      ['b', { x: 100, y: 0, width: 100, height: 40 }]
    ])
    const { rerender } = render(
      <FlipHarness order={['a', 'b']} prefersReducedMotion={false} boxes={firstBoxes} />
    )
    const elA = screen.getByTestId('el-a')
    rerender(<FlipHarness order={['b', 'a']} prefersReducedMotion={false} boxes={lastBoxes} />)

    // first 0,0 100x40 → last 50,50 200x80 ⇒ dx=-50, dy=-50, sx=0.5, sy=0.5
    expect(invertSnapshots.get('a')).toEqual({
      transform: 'translate(-50px, -50px) scale(0.5, 0.5)',
      origin: '0 0'
    })
    expect(elA.style.transformOrigin).toBe('0 0')
    expect(elA.style.transition).toContain('transform')
    expect(elA.style.transform).toBe('')
  })

  it('omitting prefersReducedMotion honors OS matchMedia reduce (no timed transition)', () => {
    mockMatchMedia(true)
    const { rerender } = render(<FlipHarness order={['a', 'b']} />)
    const elA = screen.getByTestId('el-a')
    const elB = screen.getByTestId('el-b')
    rerender(<FlipHarness order={['b', 'a']} />)
    expect(elA.style.transition).toBe('none')
    expect(elB.style.transition).toBe('none')
    expect(elA.style.transform).toBe('')
    expect(invertSnapshots.size).toBe(0)
  })

  it('renders tiles, costs, and reduced-motion toggle', async () => {
    mockMatchMedia(false)
    const user = userEvent.setup()
    render(<AnimationDemo />)
    expect(screen.getByTestId('flip-grid').querySelectorAll('[data-testid^="tile-"]')).toHaveLength(8)
    expect(screen.getByTestId('motion-policy')).toHaveTextContent('320ms transform')
    expect(screen.getByTestId('cost-good-value')).toHaveTextContent('compositor')
    expect(screen.getByTestId('cost-bad-value')).toHaveTextContent('layout/paint')
    await user.click(screen.getByTestId('reduced-toggle'))
    expect(screen.getByTestId('motion-policy')).toHaveTextContent('instant (reduced-motion)')
    await user.click(screen.getByTestId('shuffle'))
    expect(screen.getByTestId('flip-grid').querySelectorAll('[data-testid^="tile-"]')).toHaveLength(8)
  })

  it('with OS reduced-motion and checkbox off, policy is instant and shuffle has no timed transform', async () => {
    mockMatchMedia(true)
    const user = userEvent.setup()
    render(<AnimationDemo />)
    expect(screen.getByTestId('reduced-toggle')).not.toBeChecked()
    expect(screen.getByTestId('motion-policy')).toHaveTextContent('instant (reduced-motion)')
    await user.click(screen.getByTestId('shuffle'))
    const tile = screen.getByTestId('tile-tile-0')
    expect(tile.style.transition === '' || tile.style.transition === 'none').toBe(true)
    if (tile.style.transition.includes('transform') && tile.style.transition !== 'none') {
      throw new Error(`expected no timed transform transition, got: ${tile.style.transition}`)
    }
  })
})
