'use client'

import { useLayoutEffect, useRef } from 'react'
import { captureRects, invertTransform, planFlip, type Rect } from './flip'
import { resolveMotionPolicy, transitionFor, type MotionOptions } from './motion'

export interface UseFlipOptions extends MotionOptions {
  ids: readonly string[]
}

export interface UseFlipResult {
  register: (id: string, el: HTMLElement | null) => void
}

export function useFlip(options: UseFlipOptions): UseFlipResult {
  const { ids, durationMs, easing, prefersReducedMotion } = options
  const elements = useRef(new Map<string, HTMLElement>())
  const prevRects = useRef<Map<string, Rect> | null>(null)
  const prevIdsKey = useRef('')

  const register = (id: string, el: HTMLElement | null) => {
    if (el === null) elements.current.delete(id)
    else elements.current.set(id, el)
  }

  useLayoutEffect(() => {
    const key = ids.join('\0')
    const last = captureRects(elements.current)
    const first = prevRects.current
    const orderChanged = prevIdsKey.current !== key
    prevIdsKey.current = key
    prevRects.current = last

    if (first === null || !orderChanged) return

    const policy = resolveMotionPolicy({ durationMs, easing, prefersReducedMotion })
    for (const entry of planFlip(first, last)) {
      if (entry.noop) continue
      const el = elements.current.get(entry.id)
      if (el === undefined) continue
      if (!policy.animate) {
        el.style.transition = 'none'
        el.style.transform = ''
        continue
      }
      el.style.transformOrigin = '0 0'
      el.style.transition = 'none'
      el.style.transform = invertTransform(entry.delta)
      void el.getBoundingClientRect()
      el.style.transition = transitionFor('transform', policy)
      el.style.transform = ''
    }
  }, [ids, durationMs, easing, prefersReducedMotion])

  return { register }
}
