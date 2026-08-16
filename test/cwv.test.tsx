import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  CWV_THRESHOLDS,
  DEFAULT_BUDGET,
  computeCls,
  computeInp,
  computeLcp,
  estimateImageLayoutShift,
  evaluateBudget,
  evaluateMetric,
  inpProbeLabels,
  projectRoute,
  rateMetric
} from '@/cwv'
import { CwvDemo } from '../app/cwv/demo'

describe('budget + metrics', () => {
  it('rates thresholds, evaluates budgets, and computes LCP/INP/CLS', () => {
    expect(rateMetric('LCP', CWV_THRESHOLDS.LCP.good)).toBe('good')
    expect(rateMetric('LCP', CWV_THRESHOLDS.LCP.good + 1)).toBe('needs-improvement')
    expect(rateMetric('LCP', CWV_THRESHOLDS.LCP.needsImprovement + 1)).toBe('poor')
    expect(rateMetric('INP', 200)).toBe('good')
    expect(rateMetric('INP', 501)).toBe('poor')
    expect(rateMetric('CLS', 0.1)).toBe('good')
    expect(rateMetric('CLS', 0.26)).toBe('poor')
    expect(() => rateMetric('LCP', -1)).toThrow(RangeError)
    expect(() => rateMetric('INP', Number.NaN)).toThrow(RangeError)

    expect(evaluateMetric({ name: 'INP', value: null })).toMatchObject({
      rating: 'unknown',
      withinBudget: false,
      headroom: null
    })
    expect(evaluateMetric({ name: 'LCP', value: Number.NaN })).toMatchObject({
      rating: 'unknown',
      withinBudget: false
    })
    expect(evaluateMetric({ name: 'CLS', value: -0.01 })).toMatchObject({
      rating: 'unknown',
      withinBudget: false
    })
    expect(evaluateBudget([]).pass).toBe(false)
    // Hard gate: null / missing budgeted metrics must not pass.
    expect(
      evaluateBudget([
        { name: 'LCP', value: 1000 },
        { name: 'INP', value: null },
        { name: 'CLS', value: 0.01 }
      ]).pass
    ).toBe(false)
    expect(
      evaluateBudget([
        { name: 'LCP', value: 1000 },
        { name: 'CLS', value: 0.01 }
      ]).pass
    ).toBe(false)
    expect(
      evaluateBudget([
        { name: 'LCP', value: 1000 },
        { name: 'INP', value: 40 },
        { name: 'CLS', value: 0.01 }
      ]).pass
    ).toBe(true)
    const fail = evaluateBudget([
      { name: 'LCP', value: 3000 },
      { name: 'INP', value: 50 },
      { name: 'CLS', value: 0.05 }
    ])
    expect(fail.pass).toBe(false)
    expect(fail.metrics.find((m) => m.name === 'LCP')?.headroom).toBe(DEFAULT_BUDGET.LCP - 3000)
    expect(
      evaluateBudget(
        [
          { name: 'LCP', value: 1200 },
          { name: 'INP', value: 40 },
          { name: 'CLS', value: 0.01 }
        ],
        { LCP: 1000, INP: 50, CLS: 0.05 }
      ).pass
    ).toBe(false)

    expect(computeLcp([])).toBe(null)
    expect(computeLcp([{ startTime: Number.NaN }, { startTime: -4 }])).toBe(null)
    expect(computeLcp([{ startTime: 800 }, { startTime: 1500 }])).toBe(1500)

    expect(computeCls([])).toBe(0)
    expect(
      computeCls([
        { value: 0.1, startTime: 100, hadRecentInput: true },
        { value: 0.05, startTime: 200 }
      ])
    ).toBe(0.05)
    expect(
      computeCls([
        { value: 0.05, startTime: 0 },
        { value: 0.05, startTime: 500 },
        { value: 0.05, startTime: 900 }
      ])
    ).toBeCloseTo(0.15)
    expect(
      computeCls([
        { value: 0.08, startTime: 0 },
        { value: 0.08, startTime: 500 },
        { value: 0.2, startTime: 2000 }
      ])
    ).toBeCloseTo(0.2)
    // Reverse order must match chronological windowing (max window 0.1, not 0.2).
    expect(
      computeCls([
        { value: 0.1, startTime: 2000 },
        { value: 0.1, startTime: 0 }
      ])
    ).toBeCloseTo(0.1)
    // Eight 0.04 shifts at 900ms steps: windows break on 5s cap → max session sum 0.24.
    const long = Array.from({ length: 8 }, (_, i) => ({ value: 0.04, startTime: i * 900 }))
    expect(computeCls(long)).toBeCloseTo(0.24)

    expect(computeInp([])).toBe(null)
    expect(computeInp([{ duration: -1 }])).toBe(null)
    expect(computeInp([{ duration: 40 }, { duration: 120 }, { duration: 80 }])).toBe(120)
    expect(computeInp(Array.from({ length: 100 }, (_, i) => ({ duration: i + 1 })))).toBe(98)
  })

  it('projects slow fail / fixed pass and reserved-space CLS', () => {
    expect(evaluateBudget(projectRoute('slow').samples).pass).toBe(false)
    expect(evaluateBudget(projectRoute('fixed').samples).pass).toBe(true)
    expect(estimateImageLayoutShift({ imageWidth: 360, imageHeight: 240, reserved: true })).toBe(0)
    expect(estimateImageLayoutShift({ imageWidth: 0, imageHeight: 240, reserved: false })).toBe(0)
    expect(estimateImageLayoutShift({ imageWidth: 360, imageHeight: 240, reserved: false })).toBeGreaterThan(0)
  })

  it('documents INP probe dual-readout semantics per mode', () => {
    const sync = inpProbeLabels('sync')
    const deferred = inpProbeLabels('deferred')
    expect(sync.dualReadout).toBe(true)
    expect(deferred.dualReadout).toBe(true)
    expect(sync.blocksPaint).toBe(true)
    expect(deferred.blocksPaint).toBe(false)
    expect(sync.frameLabel).not.toBe(deferred.frameLabel)
  })
})

describe('CwvDemo', () => {
  it('renders budget cells, late-inject slow hero, and dual INP readouts', async () => {
    const user = userEvent.setup()
    render(<CwvDemo />)
    expect(screen.getByTestId('slow-verdict')).toHaveTextContent('FAIL')
    expect(screen.getByTestId('fixed-verdict')).toHaveTextContent('PASS')
    expect(screen.getByTestId('slow-LCP-rating')).toHaveTextContent('fail')
    expect(screen.getByTestId('fixed-CLS-value')).toHaveTextContent('0.000')
    expect(screen.getByTestId('hero-fixed')).toBeInTheDocument()
    // Slow path must not reserve height up front; late inject mounts the box.
    expect(screen.queryByTestId('hero-late-box')).not.toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByTestId('hero-late-box')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('inp-run'))
    expect(screen.getByTestId('inp-to-frame').textContent).toMatch(/ms to first frame/)
    expect(screen.getByTestId('inp-work').textContent).toMatch(/ms work/)
    expect(screen.getByTestId('inp-mode-label')).toHaveTextContent(/sync: frame includes work/)

    await user.click(screen.getByLabelText(/Deferred past paint/i))
    await user.click(screen.getByTestId('inp-run'))
    await waitFor(() => {
      expect(screen.getByTestId('inp-to-frame').textContent).toMatch(/ms to first frame/)
      expect(screen.getByTestId('inp-work').textContent).toMatch(/ms work/)
    })
    expect(screen.getByTestId('inp-mode-label')).toHaveTextContent(/deferred: frame before work/)
  })
})
