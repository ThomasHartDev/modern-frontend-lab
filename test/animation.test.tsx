import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

function FlipHarness({ order, reduced = false }: { order: readonly string[]; reduced?: boolean }) {
  const { register } = useFlip({ ids: order, durationMs: 200, prefersReducedMotion: reduced })
  return (
    <div>
      {order.map((id, index) => (
        <div
          key={id}
          ref={(el) => {
            if (el !== null) {
              el.getBoundingClientRect = () =>
                ({ x: index * 100, y: 0, width: 100, height: 40, top: 0, left: index * 100, right: index * 100 + 100, bottom: 40, toJSON: () => ({}) }) as DOMRect
            }
            register(id, el)
          }}
          data-testid={`el-${id}`}
        />
      ))}
    </div>
  )
}

describe('useFlip + demo', () => {
  it('transitions transform on reorder; instant under reduced motion', () => {
    const { rerender } = render(<FlipHarness order={['a', 'b']} />)
    const elA = screen.getByTestId('el-a')
    const elB = screen.getByTestId('el-b')
    rerender(<FlipHarness order={['b', 'a']} />)
    expect(elA.style.transition).toContain('transform')
    expect(elA.style.transform).toBe('')
    expect(elB.style.transition).toContain('transform')
    rerender(<FlipHarness order={['a', 'b']} reduced />)
    expect(elA.style.transition).toBe('none')
    expect(elB.style.transition).toBe('none')
  })

  it('renders tiles, costs, and reduced-motion toggle', async () => {
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
})
