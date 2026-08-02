'use client'

import { useEffect, useId, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { getTabbableElements } from './focusable'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  initialFocusRef?: RefObject<HTMLElement | null>
}

const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.45)',
  display: 'grid',
  placeItems: 'center',
  padding: 'var(--space-4)',
  zIndex: 50
}

const panel: CSSProperties = {
  width: 'min(28rem, 100%)',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-6)',
  display: 'grid',
  gap: 'var(--space-4)'
}

export function Dialog({ open, onClose, title, children, initialFocusRef }: DialogProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const node = panelRef.current
    if (!open || node === null) return
    const root: HTMLElement = node

    restoreRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const preferred = initialFocusRef?.current
    if (preferred && root.contains(preferred)) preferred.focus()
    else getTabbableElements(root)[0]?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const tabbable = getTabbableElements(root)
      if (tabbable.length === 0) {
        event.preventDefault()
        return
      }
      const first = tabbable[0]!
      const last = tabbable[tabbable.length - 1]!
      const active = root.ownerDocument.activeElement
      const leavingEnd = !event.shiftKey && (active === last || !root.contains(active))
      const leavingStart = event.shiftKey && (active === first || !root.contains(active))
      if (leavingEnd) {
        event.preventDefault()
        first.focus()
      } else if (leavingStart) {
        event.preventDefault()
        last.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      restoreRef.current?.focus()
      restoreRef.current = null
    }
  }, [open, initialFocusRef])

  if (!open) return null

  return (
    <div style={overlay} data-testid="dialog-overlay">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={panel}
        data-testid="dialog-panel"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
          <h2 id={titleId} style={{ margin: 0, fontSize: '1.05rem' }}>
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close dialog">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
