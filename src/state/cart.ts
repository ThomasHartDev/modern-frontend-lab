export interface CartItem {
  id: string
  name: string
  price: number
  qty: number
}
export interface CartState {
  items: readonly CartItem[]
  // Changes often and is unrelated to the badge/total; useful for showing re-render cost.
  note: string
}
export type CartAction =
  | { type: 'add'; item: Omit<CartItem, 'qty'>; qty?: number }
  | { type: 'remove'; id: string }
  | { type: 'setQty'; id: string; qty: number }
  | { type: 'setNote'; note: string }
  | { type: 'clear' }
export const EMPTY_CART: CartState = { items: [], note: '' }
export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
      const qty = action.qty ?? 1
      if (qty <= 0) return state
      const existing = state.items.find((i) => i.id === action.item.id)
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) => (i.id === action.item.id ? { ...i, qty: i.qty + qty } : i))
        }
      }
      return { ...state, items: [...state.items, { ...action.item, qty }] }
    }
    case 'remove': {
      if (!state.items.some((i) => i.id === action.id)) return state
      return { ...state, items: state.items.filter((i) => i.id !== action.id) }
    }
    case 'setQty': {
      if (action.qty < 0) return state
      const target = state.items.find((i) => i.id === action.id)
      if (!target) return state
      if (action.qty === 0) return { ...state, items: state.items.filter((i) => i.id !== action.id) }
      if (target.qty === action.qty) return state
      return {
        ...state,
        items: state.items.map((i) => (i.id === action.id ? { ...i, qty: action.qty } : i))
      }
    }
    case 'setNote':
      if (state.note === action.note) return state
      return { ...state, note: action.note }
    case 'clear':
      if (state.items.length === 0 && state.note === '') return state
      return EMPTY_CART
    default: {
      const _exhaustive: never = action
      return _exhaustive
    }
  }
}
export function selectItemCount(state: CartState): number {
  return state.items.reduce((sum, i) => sum + i.qty, 0)
}
export function selectTotal(state: CartState): number {
  return state.items.reduce((sum, i) => sum + i.price * i.qty, 0)
}
export function selectNote(state: CartState): string {
  return state.note
}
