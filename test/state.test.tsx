import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EMPTY_CART, cartReducer, selectItemCount, selectNote, selectTotal, type CartState } from '@/state/cart'
import { CartProvider, useCartDispatch, useCartState } from '@/state/cart-context'
import { createReducerStore, useStoreSelector } from '@/state/create-store'
const mug = { id: 'mug', name: 'Mug', price: 12 }
const sticker = { id: 'sticker', name: 'Sticker', price: 3 }
describe('cartReducer', () => {
  it('adds, merges qty, remove/setQty edges, note, clear, and selectors', () => {
    const once = cartReducer(EMPTY_CART, { type: 'add', item: mug, qty: 2 })
    expect(once.items).toEqual([{ ...mug, qty: 2 }])
    expect(cartReducer(once, { type: 'add', item: mug, qty: 3 }).items[0]?.qty).toBe(5)
    const state: CartState = { items: [{ ...mug, qty: 2 }, { ...sticker, qty: 1 }], note: '' }
    expect(cartReducer(state, { type: 'add', item: mug, qty: 0 })).toBe(state)
    expect(cartReducer(state, { type: 'remove', id: 'mug' }).items.map((i) => i.id)).toEqual(['sticker'])
    expect(cartReducer(state, { type: 'remove', id: 'x' })).toBe(state)
    expect(cartReducer(state, { type: 'setQty', id: 'mug', qty: 4 }).items[0]?.qty).toBe(4)
    expect(cartReducer(state, { type: 'setQty', id: 'mug', qty: 0 }).items.map((i) => i.id)).toEqual(['sticker'])
    expect(cartReducer(state, { type: 'setQty', id: 'mug', qty: -1 })).toBe(state)
    expect(cartReducer(state, { type: 'setQty', id: 'mug', qty: 2 })).toBe(state)
    const noted = cartReducer(EMPTY_CART, { type: 'setNote', note: 'gift' })
    expect(noted.note).toBe('gift')
    expect(cartReducer(noted, { type: 'setNote', note: 'gift' })).toBe(noted)
    expect(cartReducer({ items: [{ ...mug, qty: 1 }], note: 'x' }, { type: 'clear' })).toEqual(EMPTY_CART)
    expect(cartReducer(EMPTY_CART, { type: 'clear' })).toBe(EMPTY_CART)
    expect(selectItemCount(state)).toBe(3)
    expect(selectTotal(state)).toBe(2 * 12 + 3)
    expect(selectNote(noted)).toBe('gift')
    expect(selectItemCount(EMPTY_CART)).toBe(0)
  })
})
describe('createReducerStore + useStoreSelector', () => {
  it('notifies, skips no-ops, isolates re-renders by slice, equality, and clear', () => {
    const store = createReducerStore(cartReducer, EMPTY_CART)
    const seen: number[] = []
    const unsub = store.subscribe(() => {
      seen.push(selectItemCount(store.getState()))
    })
    store.dispatch({ type: 'add', item: mug, qty: 2 })
    store.dispatch({ type: 'setNote', note: 'a' })
    store.dispatch({ type: 'setNote', note: 'a' })
    expect(seen).toEqual([2, 2])
    unsub()
    store.dispatch({ type: 'add', item: mug })
    expect(seen).toEqual([2, 2])
    const store2 = createReducerStore(cartReducer, EMPTY_CART)
    let countRenders = 0
    let noteRenders = 0
    const count = renderHook(() => {
      countRenders += 1
      return useStoreSelector(store2, selectItemCount)
    })
    const note = renderHook(() => {
      noteRenders += 1
      return useStoreSelector(store2, selectNote)
    })
    const countBefore = countRenders
    const noteBefore = noteRenders
    act(() => {
      store2.dispatch({ type: 'setNote', note: 'wrap' })
    })
    expect(note.result.current).toBe('wrap')
    expect(noteRenders).toBeGreaterThan(noteBefore)
    expect(countRenders).toBe(countBefore)
    act(() => {
      store2.dispatch({ type: 'add', item: mug, qty: 2 })
    })
    expect(count.result.current).toBe(2)
    const store3 = createReducerStore(cartReducer, EMPTY_CART)
    store3.dispatch({ type: 'add', item: mug, qty: 1 })
    const { result } = renderHook(() =>
      useStoreSelector(store3, (s) => ({ count: selectItemCount(s) }), (a, b) => a.count === b.count)
    )
    const first = result.current
    act(() => {
      store3.dispatch({ type: 'setNote', note: 'noop' })
    })
    expect(result.current).toBe(first)
    act(() => {
      store3.dispatch({ type: 'clear' })
    })
    expect(result.current.count).toBe(0)
  })
})
describe('CartProvider', () => {
  function Shell() {
    const state = useCartState()
    const dispatch = useCartDispatch()
    return (
      <>
        <span data-testid="count">{selectItemCount(state)}</span>
        <button type="button" onClick={() => dispatch({ type: 'add', item: mug })}>
          add
        </button>
        <button type="button" onClick={() => dispatch({ type: 'clear' })}>
          clear
        </button>
      </>
    )
  }
  it('shares state, seeds initial, and throws outside the provider', async () => {
    const user = userEvent.setup()
    render(
      <CartProvider initial={{ items: [{ ...sticker, qty: 2 }], note: 'seed' }}>
        <Shell />
      </CartProvider>
    )
    expect(screen.getByTestId('count')).toHaveTextContent('2')
    await user.click(screen.getByRole('button', { name: 'add' }))
    expect(screen.getByTestId('count')).toHaveTextContent('3')
    await user.click(screen.getByRole('button', { name: 'clear' }))
    expect(screen.getByTestId('count')).toHaveTextContent('0')
    function Outside() {
      useCartState()
      return null
    }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Outside />)).toThrow(/CartProvider/)
    spy.mockRestore()
  })
})
