export interface VirtualRange {
  start: number
  end: number
  offsetY: number
  totalHeight: number
  mountedCount: number
}

export interface RangeParams {
  scrollTop: number
  viewportHeight: number
  itemCount: number
  itemHeight: number
  overscan?: number
}

// Fixed row height → O(1) index math. Variable height needs a size cache + search.
export function getVisibleRange(params: RangeParams): VirtualRange {
  const itemCount = Math.max(0, Math.floor(params.itemCount))
  const itemHeight = params.itemHeight
  const overscan = Math.max(0, Math.floor(params.overscan ?? 0))

  if (itemCount === 0 || !(itemHeight > 0) || !Number.isFinite(itemHeight)) {
    return { start: 0, end: 0, offsetY: 0, totalHeight: 0, mountedCount: 0 }
  }

  const totalHeight = itemCount * itemHeight
  const viewportHeight = Math.max(0, params.viewportHeight)
  const scrollTop = clamp(
    Number.isFinite(params.scrollTop) ? params.scrollTop : 0,
    0,
    Math.max(0, totalHeight)
  )

  const firstVisible = Math.floor(scrollTop / itemHeight)
  const lastVisible = Math.ceil((scrollTop + viewportHeight) / itemHeight) - 1

  const start = Math.max(0, firstVisible - overscan)
  const end = Math.min(itemCount, Math.max(start, lastVisible + 1 + overscan))

  return {
    start,
    end,
    offsetY: start * itemHeight,
    totalHeight,
    mountedCount: end - start
  }
}

export function estimateMountCost(mountedCount: number, costPerRow = 1): number {
  if (!(mountedCount > 0) || !Number.isFinite(mountedCount)) return 0
  return mountedCount * costPerRow
}

export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min
  if (value > max) return max
  return value
}
