export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface FlipDelta {
  dx: number
  dy: number
  sx: number
  sy: number
}

export interface FlipPlanEntry {
  id: string
  delta: FlipDelta
  noop: boolean
}

const DEFAULT_EPSILON = 0.5

export function rectFromDOMRect(r: Pick<DOMRect, 'x' | 'y' | 'width' | 'height'>): Rect {
  return { x: r.x, y: r.y, width: r.width, height: r.height }
}

/** Invert: transform mapping Last geometry onto First so the eye sees no jump. */
export function computeFlipDelta(first: Rect, last: Rect): FlipDelta {
  const lastW = last.width === 0 ? 1 : last.width
  const lastH = last.height === 0 ? 1 : last.height
  return { dx: first.x - last.x, dy: first.y - last.y, sx: first.width / lastW, sy: first.height / lastH }
}

export function isNoopDelta(delta: FlipDelta, epsilon = DEFAULT_EPSILON): boolean {
  return (
    Math.abs(delta.dx) < epsilon &&
    Math.abs(delta.dy) < epsilon &&
    Math.abs(delta.sx - 1) < epsilon / 100 &&
    Math.abs(delta.sy - 1) < epsilon / 100
  )
}

export function invertTransform(delta: FlipDelta): string {
  return `translate(${delta.dx}px, ${delta.dy}px) scale(${delta.sx}, ${delta.sy})`
}

export function planFlip(
  first: ReadonlyMap<string, Rect>,
  last: ReadonlyMap<string, Rect>,
  epsilon = DEFAULT_EPSILON
): FlipPlanEntry[] {
  const plan: FlipPlanEntry[] = []
  for (const [id, lastRect] of last) {
    const firstRect = first.get(id)
    if (firstRect === undefined) continue
    const delta = computeFlipDelta(firstRect, lastRect)
    plan.push({ id, delta, noop: isNoopDelta(delta, epsilon) })
  }
  return plan
}

export function captureRects(elements: ReadonlyMap<string, Element>): Map<string, Rect> {
  const out = new Map<string, Rect>()
  for (const [id, el] of elements) out.set(id, rectFromDOMRect(el.getBoundingClientRect()))
  return out
}
