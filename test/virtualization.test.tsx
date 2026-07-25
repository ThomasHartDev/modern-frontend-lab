import { act, render, renderHook, screen } from '@testing-library/react'
import type { UIEvent } from 'react'
import { createListItems } from '@/virtualization/items'
import { clamp, estimateMountCost, getVisibleRange, type RangeParams } from '@/virtualization/range'
import { useVirtualList } from '@/virtualization/use-virtual-list'
import { VirtualizationDemo } from '../app/virtualization/demo'

function range(partial: Partial<RangeParams> & Pick<RangeParams, 'itemCount' | 'itemHeight'>) {
  return getVisibleRange({ scrollTop: 0, viewportHeight: 200, overscan: 0, ...partial })
}

describe('getVisibleRange', () => {
  it('returns empty for empty lists and invalid row heights', () => {
    expect(range({ itemCount: 0, itemHeight: 40 })).toEqual({
      start: 0,
      end: 0,
      offsetY: 0,
      totalHeight: 0,
      mountedCount: 0
    })
    expect(range({ itemCount: 10, itemHeight: 0 }).mountedCount).toBe(0)
    expect(range({ itemCount: 10, itemHeight: -4 }).mountedCount).toBe(0)
    expect(range({ itemCount: 10, itemHeight: Number.NaN }).mountedCount).toBe(0)
  })

  it('computes first page, mid scroll, near end, and past-end clamp', () => {
    expect(range({ itemCount: 100, itemHeight: 40, viewportHeight: 200, scrollTop: 0 })).toMatchObject({
      start: 0,
      end: 5,
      offsetY: 0,
      totalHeight: 4000,
      mountedCount: 5
    })
    const mid = range({ itemCount: 100, itemHeight: 40, viewportHeight: 200, scrollTop: 400 })
    expect(mid).toMatchObject({ start: 10, end: 15, offsetY: 400 })
    const nearEnd = range({ itemCount: 100, itemHeight: 40, viewportHeight: 200, scrollTop: 3900 })
    expect(nearEnd.start).toBe(97)
    expect(nearEnd.end).toBe(100)
    expect(nearEnd.offsetY).toBe(3880)
    const past = range({ itemCount: 100, itemHeight: 40, viewportHeight: 200, scrollTop: 10_000 })
    expect(past.start).toBe(100)
    expect(past.end).toBe(100)
    expect(past.mountedCount).toBe(0)
  })

  it('expands by overscan and clamps at both edges', () => {
    const mid = range({ itemCount: 100, itemHeight: 40, viewportHeight: 200, scrollTop: 400, overscan: 3 })
    expect(mid).toMatchObject({ start: 7, end: 18, mountedCount: 11, offsetY: 280 })
    const top = range({ itemCount: 100, itemHeight: 40, viewportHeight: 200, scrollTop: 0, overscan: 5 })
    expect(top.start).toBe(0)
    expect(top.end).toBe(10)
    const bottom = range({ itemCount: 20, itemHeight: 40, viewportHeight: 200, scrollTop: 600, overscan: 5 })
    expect(bottom.start).toBe(10)
    expect(bottom.end).toBe(20)
  })

  it('handles zero viewport, negative scroll, and non-finite scroll', () => {
    const zero = range({ itemCount: 50, itemHeight: 40, viewportHeight: 0, scrollTop: 200, overscan: 2 })
    expect(zero.start).toBe(3)
    expect(zero.end).toBe(7)
    expect(range({ itemCount: 10, itemHeight: 40, scrollTop: -100 }).start).toBe(0)
    expect(range({ itemCount: 10, itemHeight: 40, scrollTop: Number.NaN }).start).toBe(0)
  })
})

describe('estimateMountCost, clamp, createListItems', () => {
  it('models cost, clamps, and builds deterministic rows', () => {
    expect(estimateMountCost(10_000)).toBe(10_000)
    expect(estimateMountCost(12, 2)).toBe(24)
    expect(estimateMountCost(0)).toBe(0)
    expect(estimateMountCost(-3)).toBe(0)
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(99, 0, 10)).toBe(10)
    expect(createListItems(0)).toEqual([])
    expect(createListItems(-2)).toEqual([])
    expect(createListItems(3.9)).toHaveLength(3)
    const items = createListItems(4)
    expect(items[0]).toEqual({ id: 'row-0', label: 'Item 1', category: 'alpha', score: 1 })
    expect(items[1]?.category).toBe('beta')
  })
})

describe('useVirtualList', () => {
  it('tracks scrollTop and exposes spacer / window styles', () => {
    const { result } = renderHook(() =>
      useVirtualList({ itemCount: 100, itemHeight: 40, viewportHeight: 200, overscan: 2 })
    )
    expect(result.current.range.start).toBe(0)
    expect(result.current.range.end).toBe(7)
    expect(result.current.spacerStyle.height).toBe(4000)
    expect(result.current.windowStyle.top).toBe(0)
    act(() => {
      result.current.onScroll({ currentTarget: { scrollTop: 400 } } as unknown as UIEvent<HTMLElement>)
    })
    expect(result.current.scrollTop).toBe(400)
    expect(result.current.range.start).toBe(8)
    expect(result.current.range.end).toBe(17)
    expect(result.current.windowStyle.top).toBe(320)
  })
})

describe('VirtualizationDemo', () => {
  it('renders naive full mount and virtual window side by side', () => {
    render(<VirtualizationDemo />)
    expect(screen.getByTestId('naive-mounted')).toHaveTextContent('10,000 / 10,000')
    // 8 visible (320/40) + 4 bottom overscan; top overscan clamps to 0 → 12
    expect(screen.getByTestId('virtual-mounted')).toHaveTextContent('12 / 10,000')
    expect(screen.getByTestId('virtual-range').textContent).toMatch(/\[0, 12\)/)
    expect(screen.getByTestId('naive-list').querySelectorAll('[data-testid="list-row"]')).toHaveLength(10_000)
    expect(screen.getByTestId('virtual-list').querySelectorAll('[data-testid="list-row"]')).toHaveLength(12)
  })
})
