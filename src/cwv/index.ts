export type MetricName = 'LCP' | 'INP' | 'CLS'
export type Rating = 'good' | 'needs-improvement' | 'poor'
export type RoutePattern = 'slow' | 'fixed'

export interface MetricThresholds {
  good: number
  needsImprovement: number
}

/** Chrome Core Web Vitals field thresholds. */
export const CWV_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 },
  INP: { good: 200, needsImprovement: 500 },
  CLS: { good: 0.1, needsImprovement: 0.25 }
} as const satisfies Record<MetricName, MetricThresholds>

export type Budget = { readonly [K in MetricName]: number }

export const DEFAULT_BUDGET: Budget = {
  LCP: CWV_THRESHOLDS.LCP.good,
  INP: CWV_THRESHOLDS.INP.good,
  CLS: CWV_THRESHOLDS.CLS.good
}

export function rateMetric(name: MetricName, value: number): Rating {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} value must be a finite number >= 0`)
  }
  const t = CWV_THRESHOLDS[name]
  if (value <= t.good) return 'good'
  if (value <= t.needsImprovement) return 'needs-improvement'
  return 'poor'
}

export interface MetricSample {
  name: MetricName
  value: number | null
}

export interface MetricEvaluation {
  name: MetricName
  value: number | null
  budget: number
  rating: Rating | 'unknown'
  withinBudget: boolean
  headroom: number | null
}

export interface BudgetReport {
  metrics: readonly MetricEvaluation[]
  pass: boolean
}

export function evaluateMetric(
  sample: MetricSample,
  budget: Budget = DEFAULT_BUDGET
): MetricEvaluation {
  const limit = budget[sample.name]
  if (sample.value === null || !Number.isFinite(sample.value)) {
    return {
      name: sample.name,
      value: sample.value,
      budget: limit,
      rating: 'unknown',
      withinBudget: false,
      headroom: null
    }
  }
  return {
    name: sample.name,
    value: sample.value,
    budget: limit,
    rating: rateMetric(sample.name, sample.value),
    withinBudget: sample.value <= limit,
    headroom: limit - sample.value
  }
}

export function evaluateBudget(
  samples: readonly MetricSample[],
  budget: Budget = DEFAULT_BUDGET
): BudgetReport {
  const metrics = samples.map((s) => evaluateMetric(s, budget))
  const known = metrics.filter((m) => m.value !== null && Number.isFinite(m.value))
  return {
    metrics,
    pass: known.length > 0 && known.every((m) => m.withinBudget)
  }
}

export interface LcpEntryLike {
  startTime: number
}

export interface LayoutShiftLike {
  value: number
  startTime: number
  hadRecentInput?: boolean
}

export interface InteractionLike {
  duration: number
}

const CLS_GAP_MS = 1000
const CLS_CAP_MS = 5000

/** Final LCP is the last valid candidate (browser emits progressive updates). */
export function computeLcp(entries: readonly LcpEntryLike[]): number | null {
  let last: number | null = null
  for (const e of entries) {
    if (Number.isFinite(e.startTime) && e.startTime >= 0) last = e.startTime
  }
  return last
}

/**
 * CLS = max session-window sum. Windows group shifts within 1s of the previous
 * and 5s of the first; input-driven shifts are excluded.
 */
export function computeCls(shifts: readonly LayoutShiftLike[]): number {
  let max = 0
  let windowScore = 0
  let windowStart = 0
  let lastTime = Number.NEGATIVE_INFINITY

  for (const s of shifts) {
    if (s.hadRecentInput) continue
    if (!Number.isFinite(s.value) || s.value < 0) continue
    if (!Number.isFinite(s.startTime) || s.startTime < 0) continue

    if (
      lastTime === Number.NEGATIVE_INFINITY ||
      s.startTime - lastTime > CLS_GAP_MS ||
      s.startTime - windowStart > CLS_CAP_MS
    ) {
      windowStart = s.startTime
      windowScore = 0
    }
    windowScore += s.value
    lastTime = s.startTime
    if (windowScore > max) max = windowScore
  }
  return max
}

/** Under 50 samples: worst latency. At scale: ~98th percentile. */
export function computeInp(interactions: readonly InteractionLike[]): number | null {
  const ds: number[] = []
  for (const i of interactions) {
    if (Number.isFinite(i.duration) && i.duration >= 0) ds.push(i.duration)
  }
  if (ds.length === 0) return null
  ds.sort((a, b) => a - b)
  if (ds.length < 50) return ds[ds.length - 1] ?? null
  const idx = Math.min(ds.length - 1, Math.ceil(ds.length * 0.98) - 1)
  return ds[idx] ?? null
}

export interface PatternProjection {
  pattern: RoutePattern
  samples: readonly MetricSample[]
}

const VIEWPORT_AREA = 375 * 667

/** Unreserved media: impact × distance approximation of a layout-shift score. */
export function estimateImageLayoutShift(opts: {
  imageWidth: number
  imageHeight: number
  reserved: boolean
  viewportArea?: number
}): number {
  if (opts.reserved) return 0
  if (!(opts.imageWidth > 0) || !(opts.imageHeight > 0)) return 0
  const area = opts.viewportArea ?? VIEWPORT_AREA
  if (!(area > 0)) return 0
  const impact = Math.min(1, (opts.imageWidth * opts.imageHeight) / area)
  const distance = Math.min(1, opts.imageHeight / Math.sqrt(area))
  return Math.round(impact * distance * 10_000) / 10_000
}

export function projectRoute(pattern: RoutePattern): PatternProjection {
  const media = { imageWidth: 360, imageHeight: 240 }
  if (pattern === 'slow') {
    return {
      pattern,
      samples: [
        { name: 'LCP', value: 3200 },
        { name: 'INP', value: 280 },
        { name: 'CLS', value: estimateImageLayoutShift({ ...media, reserved: false }) }
      ]
    }
  }
  return {
    pattern,
    samples: [
      { name: 'LCP', value: 1400 },
      { name: 'INP', value: 48 },
      { name: 'CLS', value: estimateImageLayoutShift({ ...media, reserved: true }) }
    ]
  }
}
