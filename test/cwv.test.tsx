import { render, screen } from '@testing-library/react'
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
    expect(evaluateBudget([]).pass).toBe(false)
    expect(
      evaluateBudget([
        { name: 'LCP', value: 1000 },
        { name: 'INP', value: null },
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
    const long = Array.from({ length: 8 }, (_, i) => ({ value: 0.04, startTime: i * 900 }))
    expect(computeCls(long)).toBeGreaterThan(0)
    expect(computeCls(long)).toBeLessThanOrEqual(0.28)

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
})

describe('CwvDemo', () => {
  it('renders budget cells and runs the INP probe', async () => {
    const user = userEvent.setup()
    render(<CwvDemo />)
    expect(screen.getByTestId('slow-verdict')).toHaveTextContent('FAIL')
    expect(screen.getByTestId('fixed-verdict')).toHaveTextContent('PASS')
    expect(screen.getByTestId('slow-LCP-rating')).toHaveTextContent('fail')
    expect(screen.getByTestId('fixed-CLS-value')).toHaveTextContent('0.000')
    await user.click(screen.getByTestId('inp-run'))
    expect(screen.getByTestId('inp-ms').textContent).toMatch(/ms work/)
    await user.click(screen.getByLabelText(/Deferred past paint/i))
    await user.click(screen.getByTestId('inp-run'))
    expect(screen.getByTestId('inp-ms').textContent).toMatch(/ms work/)
  })
})
