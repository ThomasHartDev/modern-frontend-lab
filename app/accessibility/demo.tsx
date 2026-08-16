'use client'

import { useRef, useState, type CSSProperties } from 'react'
import { Dialog } from '@/a11y/dialog'
import { Tabs } from '@/a11y/tabs'
import { token } from '@/tokens'

const card: CSSProperties = {
  padding: token('space', '4'),
  border: '1px solid var(--color-border)',
  borderRadius: token('radius', 'md'),
  background: 'var(--color-surface)',
  display: 'grid',
  gap: token('space', '3')
}

export function AccessibilityDemo() {
  const [open, setOpen] = useState(false)
  const confirmRef = useRef<HTMLButtonElement>(null)

  return (
    <div style={{ display: 'grid', gap: token('space', '6'), marginTop: token('space', '8') }}>
      <section aria-label="Dialog demo" style={card}>
        <h2 style={{ margin: 0, fontSize: token('fontSize', 'lg') }}>Modal dialog</h2>
        <p style={{ margin: 0, color: token('color', 'muted'), fontSize: token('fontSize', 'sm') }}>
          Focus moves to Confirm, Tab stays inside, Escape closes, focus returns to the trigger.
        </p>
        <button type="button" onClick={() => setOpen(true)} data-testid="open-dialog">
          Open confirm dialog
        </button>
        <Dialog open={open} onClose={() => setOpen(false)} title="Confirm action" initialFocusRef={confirmRef}>
          <p style={{ margin: 0 }}>Modal content stays available to assistive tech until closed.</p>
          <div style={{ display: 'flex', gap: token('space', '3'), justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button ref={confirmRef} type="button" onClick={() => setOpen(false)} data-testid="confirm-dialog">
              Confirm
            </button>
          </div>
        </Dialog>
      </section>

      <section aria-label="Tabs demo" style={card}>
        <h2 style={{ margin: 0, fontSize: token('fontSize', 'lg') }}>Roving-tabindex tabs</h2>
        <p style={{ margin: 0, color: token('color', 'muted'), fontSize: token('fontSize', 'sm') }}>
          One Tab stop. Arrows, Home, and End move selection and focus.
        </p>
        <Tabs
          label="Accessibility patterns"
          items={[
            { id: 'focus', label: 'Focus', panel: <p style={{ margin: 0 }}>Restore focus to the control that opened a dialog.</p> },
            { id: 'aria', label: 'ARIA', panel: <p style={{ margin: 0 }}>Roles describe structure when native HTML is not enough.</p> },
            { id: 'keyboard', label: 'Keyboard', panel: <p style={{ margin: 0 }}>Roving tabindex keeps composites as a single Tab stop.</p> }
          ]}
        />
      </section>
    </div>
  )
}
