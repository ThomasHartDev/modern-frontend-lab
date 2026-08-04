export interface MotionPolicy {
  animate: boolean
  durationMs: number
  easing: string
}

export interface MotionOptions {
  durationMs?: number
  easing?: string
  prefersReducedMotion?: boolean
}

const DEFAULT_DURATION_MS = 280
const DEFAULT_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'

const COMPOSITOR = new Set(['transform', 'opacity', 'filter', 'clip-path', 'translate', 'scale', 'rotate'])
const LAYOUT = new Set(['top', 'left', 'right', 'bottom', 'width', 'height', 'margin', 'padding', 'border-width', 'font-size'])

export type PropertyClass = 'compositor' | 'layout' | 'paint' | 'unknown'

export function readPrefersReducedMotion(
  media: Pick<MediaQueryList, 'matches'> | null | undefined = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null
): boolean {
  return media?.matches === true
}

export function resolveMotionPolicy(options: MotionOptions = {}): MotionPolicy {
  const prefers = options.prefersReducedMotion ?? readPrefersReducedMotion()
  const base = options.durationMs ?? DEFAULT_DURATION_MS
  const durationMs = prefers || !(base > 0) || !Number.isFinite(base) ? 0 : Math.floor(base)
  return { animate: durationMs > 0, durationMs, easing: options.easing ?? DEFAULT_EASING }
}

export function transitionFor(property: string, policy: MotionPolicy): string {
  if (!policy.animate) return 'none'
  return `${property} ${policy.durationMs}ms ${policy.easing}`
}

export function classifyProperty(name: string): PropertyClass {
  const key = name.trim().toLowerCase()
  if (COMPOSITOR.has(key)) return 'compositor'
  if (LAYOUT.has(key)) return 'layout'
  if (key === 'color' || key === 'background-color' || key === 'box-shadow' || key === 'border-color') {
    return 'paint'
  }
  return 'unknown'
}

export function isCompositorSafe(properties: readonly string[]): boolean {
  return properties.length > 0 && properties.every((p) => classifyProperty(p) === 'compositor')
}

export function estimateFrameCost(properties: readonly string[]): number {
  let cost = 0
  for (const p of properties) {
    const kind = classifyProperty(p)
    cost += kind === 'layout' ? 100 : kind === 'paint' ? 10 : kind === 'compositor' ? 1 : 20
  }
  return cost
}
