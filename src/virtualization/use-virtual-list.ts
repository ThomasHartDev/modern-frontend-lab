'use client'

import { useCallback, useMemo, useRef, useState, type RefObject, type UIEvent } from 'react'
import { getVisibleRange, type VirtualRange } from './range'

export interface UseVirtualListOptions {
  itemCount: number
  itemHeight: number
  viewportHeight: number
  overscan?: number
}

export interface VirtualListState {
  range: VirtualRange
  scrollTop: number
  onScroll: (event: UIEvent<HTMLElement>) => void
  scrollRef: RefObject<HTMLDivElement | null>
  spacerStyle: { height: number; position: 'relative' }
  windowStyle: { position: 'absolute'; top: number; left: 0; right: 0 }
}

export function useVirtualList(options: UseVirtualListOptions): VirtualListState {
  const { itemCount, itemHeight, viewportHeight, overscan = 4 } = options
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [scrollTop, setScrollTop] = useState(0)

  const onScroll = useCallback((event: UIEvent<HTMLElement>) => {
    setScrollTop(event.currentTarget.scrollTop)
  }, [])

  const range = useMemo(
    () =>
      getVisibleRange({
        scrollTop,
        viewportHeight,
        itemCount,
        itemHeight,
        overscan
      }),
    [scrollTop, viewportHeight, itemCount, itemHeight, overscan]
  )

  return {
    range,
    scrollTop,
    onScroll,
    scrollRef,
    spacerStyle: { height: range.totalHeight, position: 'relative' },
    windowStyle: { position: 'absolute', top: range.offsetY, left: 0, right: 0 }
  }
}
