import { useRef, useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { beforeAll, describe, expect, it } from 'vitest'
import { Dialog } from '@/a11y/dialog'
import { getTabbableElements } from '@/a11y/focusable'
import { nextRovingIndex } from '@/a11y/roving'
import { Tabs } from '@/a11y/tabs'
import { AccessibilityDemo } from '../app/accessibility/demo'

expect.extend(toHaveNoViolations)
beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = () => {}
})

describe('nextRovingIndex', () => {
  it('moves, wraps, clamps, and honors Home/End/orientation', () => {
    expect(nextRovingIndex({ length: 3, current: 2, key: 'ArrowRight' })).toBe(0)
    expect(nextRovingIndex({ length: 3, current: 2, key: 'ArrowRight', loop: false })).toBe(2)
    expect(nextRovingIndex({ length: 3, current: 0, key: 'ArrowLeft', loop: false })).toBe(0)
    expect(nextRovingIndex({ length: 4, current: 2, key: 'Home' })).toBe(0)
    expect(nextRovingIndex({ length: 4, current: 1, key: 'End' })).toBe(3)
    expect(nextRovingIndex({ length: 3, current: 0, key: 'ArrowDown', orientation: 'vertical' })).toBe(1)
    expect(nextRovingIndex({ length: 3, current: 0, key: 'ArrowRight', orientation: 'vertical' })).toBe(0)
    expect(nextRovingIndex({ length: 0, current: 0, key: 'ArrowRight' })).toBe(0)
    expect(nextRovingIndex({ length: 3, current: 99, key: 'ArrowLeft' })).toBe(0)
  })
})

describe('getTabbableElements', () => {
  it('returns visible tabbable controls and skips empty roots', () => {
    const root = document.createElement('div')
    root.innerHTML = `
      <button type="button">A</button>
      <button type="button" disabled>B</button>
      <button type="button" tabindex="-1">C</button>
      <a href="/x">D</a>
      <input type="hidden" value="h" />
      <input type="text" value="e" />
    `
    document.body.appendChild(root)
    const labels = getTabbableElements(root).map((el) => el.textContent || (el as HTMLInputElement).value)
    expect(labels).toEqual(['A', 'D', 'e'])
    root.remove()
    const empty = document.createElement('div')
    empty.innerHTML = '<p>static</p><span tabindex="-1">skip</span>'
    expect(getTabbableElements(empty)).toEqual([])
  })
})

describe('Dialog', () => {
  it('exposes ARIA, traps Tab, restores focus, and passes axe', async () => {
    const user = userEvent.setup()
    function Harness() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          <Dialog open={open} onClose={() => setOpen(false)} title="Restore test">
            <button type="button">First action</button>
            <button type="button">Second action</button>
          </Dialog>
        </>
      )
    }
    const { container, rerender } = render(
      <Dialog open={false} onClose={() => {}} title="Sample dialog">
        <button type="button">Action</button>
      </Dialog>
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    rerender(
      <Dialog open onClose={() => {}} title="Sample dialog">
        <p>Accessible body</p>
        <button type="button">OK</button>
      </Dialog>
    )
    expect(screen.getByRole('dialog', { name: 'Sample dialog' })).toHaveAttribute('aria-modal', 'true')
    expect(await axe(document.body)).toHaveNoViolations()

    rerender(<Harness />)
    const trigger = screen.getByRole('button', { name: 'Open' })
    trigger.focus()
    await user.click(trigger)
    const dialog = screen.getByRole('dialog')
    const close = within(dialog).getByRole('button', { name: 'Close dialog' })
    const first = within(dialog).getByRole('button', { name: 'First action' })
    const second = within(dialog).getByRole('button', { name: 'Second action' })
    expect(document.activeElement).toBe(close)
    await user.tab()
    expect(document.activeElement).toBe(first)
    await user.tab()
    expect(document.activeElement).toBe(second)
    await user.tab()
    expect(document.activeElement).toBe(close)
    await user.tab({ shift: true })
    expect(document.activeElement).toBe(second)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.activeElement).toBe(trigger)
  })

  it('moves initial focus to initialFocusRef when provided', async () => {
    const user = userEvent.setup()
    function Harness() {
      const [open, setOpen] = useState(false)
      const confirmRef = useRef<HTMLButtonElement>(null)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          <Dialog open={open} onClose={() => setOpen(false)} title="Confirm" initialFocusRef={confirmRef}>
            <button type="button">Cancel</button>
            <button ref={confirmRef} type="button">
              Confirm
            </button>
          </Dialog>
        </>
      )
    }
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Confirm' }))
    expect(document.activeElement).not.toBe(screen.getByRole('button', { name: 'Close dialog' }))
  })

  it('keeps focus inside the dialog when the overlay is pointer-activated', async () => {
    const user = userEvent.setup()
    function Harness() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          <Dialog open={open} onClose={() => setOpen(false)} title="Pointer trap">
            <button type="button">Inside</button>
          </Dialog>
        </>
      )
    }
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    const dialog = screen.getByRole('dialog')
    const overlay = screen.getByTestId('dialog-overlay')
    // Center click would hit the panel; pointerdown on the backdrop itself.
    fireEvent.pointerDown(overlay)
    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  it('excludes background content from the a11y tree while open', async () => {
    const user = userEvent.setup()
    function Harness() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          <button type="button">Outside control</button>
          <Dialog open={open} onClose={() => setOpen(false)} title="Background exclusion">
            <button type="button">Inside</button>
          </Dialog>
        </>
      )
    }
    render(<Harness />)
    expect(screen.getByRole('button', { name: 'Outside control' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Outside control' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Inside' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Outside control' })).toBeInTheDocument()
  })
})

describe('Tabs', () => {
  const items = [
    { id: 'a', label: 'Alpha', panel: <p>Panel A</p> },
    { id: 'b', label: 'Beta', panel: <p>Panel B</p> },
    { id: 'c', label: 'Gamma', panel: <p>Panel C</p> }
  ]

  it('wires ARIA, moves with arrows, and handles empty', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Tabs items={items} label="Demo tabs" />)
    const alpha = screen.getByRole('tab', { name: 'Alpha' })
    expect(alpha).toHaveAttribute('aria-selected', 'true')
    expect(alpha).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('tabindex', '-1')
    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveAttribute('aria-labelledby', alpha.id)
    expect(alpha.getAttribute('aria-controls')).toBe(panel.id)
    alpha.focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true')
    rerender(<Tabs items={[]} label="Empty" />)
    expect(screen.getByRole('status')).toHaveTextContent('No tabs')
  })

  it('clamps selection when items shrink below the stored index', () => {
    const three = [
      { id: 'a', label: 'Alpha', panel: <p>Panel A</p> },
      { id: 'b', label: 'Beta', panel: <p>Panel B</p> },
      { id: 'c', label: 'Gamma', panel: <p>Panel C</p> }
    ]
    const { rerender } = render(<Tabs items={three} defaultIndex={2} label="Shrink tabs" />)
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('tab-panel')).toHaveTextContent('Panel C')
    rerender(<Tabs items={[three[0]!]} defaultIndex={2} label="Shrink tabs" />)
    const only = screen.getByRole('tab', { name: 'Alpha' })
    expect(only).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('tab-panel')).toHaveTextContent('Panel A')
    expect(screen.queryByRole('tab', { name: 'Gamma' })).not.toBeInTheDocument()
  })

  it('has no axe violations', async () => {
    const { container } = render(<Tabs items={items} label="Axe tabs" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('AccessibilityDemo', () => {
  it('opens the dialog and passes axe open and closed', async () => {
    const user = userEvent.setup()
    const { container } = render(<AccessibilityDemo />)
    expect(await axe(container)).toHaveNoViolations()
    await user.click(screen.getByTestId('open-dialog'))
    expect(screen.getByRole('dialog', { name: 'Confirm action' })).toBeInTheDocument()
    expect(document.activeElement).toBe(screen.getByTestId('confirm-dialog'))
    expect(await axe(document.body)).toHaveNoViolations()
  })
})
