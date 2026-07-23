'use client'
import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import {
  EMPTY_CART,
  cartReducer,
  selectItemCount,
  selectNote,
  selectTotal,
  type CartAction,
  type CartItem,
  type CartState
} from '@/state/cart'
import { CartProvider, useCartDispatch, useCartState } from '@/state/cart-context'
import { createReducerStore, useStoreSelector, type ReducerStore } from '@/state/create-store'
import { token } from '@/tokens'
const CATALOG: readonly Omit<CartItem, 'qty'>[] = [
  { id: 'mug', name: 'Mug', price: 12 },
  { id: 'sticker', name: 'Sticker', price: 3 }
]
const card: CSSProperties = {
  padding: token('space', '4'),
  border: '1px solid var(--color-border)',
  borderRadius: token('radius', 'md'),
  background: 'var(--color-surface)',
  display: 'grid',
  gap: token('space', '3')
}
const field: CSSProperties = {
  padding: token('space', '2'),
  borderRadius: token('radius', 'md'),
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg)',
  color: 'var(--color-text)'
}
function Renders({ id }: { id: string }) {
  const n = useRef(0)
  n.current += 1
  return (
    <span data-testid={`renders-${id}`} style={{ fontSize: token('fontSize', 'sm'), color: token('color', 'muted'), fontFamily: 'var(--font-mono)' }}>
      renders: {n.current}
    </span>
  )
}
function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} style={card}>
      <h2 style={{ margin: 0, fontSize: token('fontSize', 'lg') }}>{title}</h2>
      {children}
    </section>
  )
}
function AddButtons({ onAdd }: { onAdd: (item: Omit<CartItem, 'qty'>) => void }) {
  return (
    <div style={{ display: 'flex', gap: token('space', '2') }}>
      {CATALOG.map((item) => (
        <button key={item.id} type="button" onClick={() => onAdd(item)}>
          Add {item.name}
        </button>
      ))}
    </div>
  )
}
function Line({ label, value, id, testId }: { label: string; value: string | number; id: string; testId: string }) {
  return (
    <p style={{ margin: 0 }}>
      {label}: <strong data-testid={testId}>{value}</strong> <Renders id={id} />
    </p>
  )
}
// Context leaves each call useCartState, so any field change re-renders all of them.
function CtxBadge() {
  const { items } = useCartState()
  return <Line label="Items" value={items.reduce((s, i) => s + i.qty, 0)} id="ctx-badge" testId="ctx-count" />
}
function CtxTotal() {
  const { items } = useCartState()
  return <Line label="Total" value={`$${items.reduce((s, i) => s + i.price * i.qty, 0)}`} id="ctx-total" testId="ctx-total" />
}
function CtxNote() {
  const { note } = useCartState()
  const dispatch = useCartDispatch()
  return (
    <label style={{ display: 'grid', gap: token('space', '2'), fontSize: token('fontSize', 'sm') }}>
      <span>
        Note <Renders id="ctx-note" />
      </span>
      <input data-testid="ctx-note-input" value={note} onChange={(e) => dispatch({ type: 'setNote', note: e.target.value })} style={field} />
    </label>
  )
}
function ContextPanel() {
  const dispatch = useCartDispatch()
  return (
    <Panel title="Reducer + Context">
      <AddButtons onAdd={(item) => dispatch({ type: 'add', item })} />
      <CtxBadge />
      <CtxTotal />
      <CtxNote />
      <button type="button" onClick={() => dispatch({ type: 'clear' })}>
        Clear
      </button>
    </Panel>
  )
}
// Store leaves each select one slice, so setNote leaves badge and total alone.
type CartStore = ReducerStore<CartState, CartAction>
function StoreBadge({ store }: { store: CartStore }) {
  const count = useStoreSelector(store, selectItemCount)
  return <Line label="Items" value={count} id="store-badge" testId="store-count" />
}
function StoreTotal({ store }: { store: CartStore }) {
  const total = useStoreSelector(store, selectTotal)
  return <Line label="Total" value={`$${total}`} id="store-total" testId="store-total" />
}
function StoreNote({ store }: { store: CartStore }) {
  const note = useStoreSelector(store, selectNote)
  return (
    <label style={{ display: 'grid', gap: token('space', '2'), fontSize: token('fontSize', 'sm') }}>
      <span>
        Note <Renders id="store-note" />
      </span>
      <input data-testid="store-note-input" value={note} onChange={(e) => store.dispatch({ type: 'setNote', note: e.target.value })} style={field} />
    </label>
  )
}
function StorePanel({ store }: { store: CartStore }) {
  return (
    <Panel title="External store + selectors">
      <AddButtons onAdd={(item) => store.dispatch({ type: 'add', item })} />
      <StoreBadge store={store} />
      <StoreTotal store={store} />
      <StoreNote store={store} />
      <button type="button" onClick={() => store.dispatch({ type: 'clear' })}>
        Clear
      </button>
    </Panel>
  )
}
export function StateDemo() {
  const [resetKey, setResetKey] = useState(0)
  const store = useMemo(() => createReducerStore(cartReducer, EMPTY_CART), [resetKey])
  return (
    <div style={{ display: 'grid', gap: token('space', '6'), marginTop: token('space', '8') }}>
      <div style={{ display: 'grid', gap: token('space', '4'), gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))' }}>
        <CartProvider key={resetKey}>
          <ContextPanel />
        </CartProvider>
        <StorePanel store={store} />
      </div>
      <button type="button" onClick={() => setResetKey((k) => k + 1)}>
        Reset both demos
      </button>
    </div>
  )
}
