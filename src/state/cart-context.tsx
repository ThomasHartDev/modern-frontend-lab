'use client'
import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react'
import { cartReducer, EMPTY_CART, type CartAction, type CartState } from './cart'
// Split state and dispatch so components that only dispatch do not re-render
// when state changes. Dispatch identity is stable under useReducer.
const CartStateContext = createContext<CartState | null>(null)
const CartDispatchContext = createContext<Dispatch<CartAction> | null>(null)
export function CartProvider({
  children,
  initial = EMPTY_CART
}: {
  children: ReactNode
  initial?: CartState
}) {
  const [state, dispatch] = useReducer(cartReducer, initial)
  return (
    <CartDispatchContext.Provider value={dispatch}>
      <CartStateContext.Provider value={state}>{children}</CartStateContext.Provider>
    </CartDispatchContext.Provider>
  )
}
export function useCartState(): CartState {
  const state = useContext(CartStateContext)
  if (state === null) throw new Error('useCartState must be used inside CartProvider')
  return state
}
export function useCartDispatch(): Dispatch<CartAction> {
  const dispatch = useContext(CartDispatchContext)
  if (dispatch === null) throw new Error('useCartDispatch must be used inside CartProvider')
  return dispatch
}
