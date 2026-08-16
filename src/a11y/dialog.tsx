'use client'

import {
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
  type RefObject
} from 'react'
import { createPortal } from 'react-dom'
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
  const portalRootRef = useRef<HTMLDivElement>(null)
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

  // APG modals: exclude background from the a11y tree while open (portal + inert).
  useEffect(() => {
    if (!open) return
    const portalRoot = portalRootRef.current
    if (portalRoot === null) return

    type Snapshot = { el: HTMLElement; inert: boolean; ariaHidden: string | null }
    const previous: Snapshot[] = []
    for (const child of Array.from(document.body.children)) {
      if (!(child instanceof HTMLElement) || child === portalRoot) continue
      previous.push({
        el: child,
        inert: child.inert,
        ariaHidden: child.getAttribute('aria-hidden')
      })
      child.inert = true
      child.setAttribute('aria-hidden', 'true')
    }
    return () => {
      for (const { el, inert, ariaHidden } of previous) {
        el.inert = inert
        if (ariaHidden === null) el.removeAttribute('aria-hidden')
        else el.setAttribute('aria-hidden', ariaHidden)
      }
    }
  }, [open])

  function onOverlayPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return
    event.preventDefault()
    panelRef.current?.focus()
  }

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={portalRootRef}
      style={overlay}
      data-testid="dialog-overlay"
      onPointerDown={onOverlayPointerDown}
    >
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
    </div>,
    document.body
  )
}
