import { useCallback, useRef, useSyncExternalStore } from 'react'
export type Listener = () => void
export type Unsubscribe = () => void
export interface Store<T> {
  getState(): T
  subscribe(listener: Listener): Unsubscribe
}
export interface ReducerStore<T, A> extends Store<T> {
  dispatch(action: A): void
}
export function createReducerStore<T, A>(
  reducer: (state: T, action: A) => T,
  initial: T
): ReducerStore<T, A> {
  let state = initial
  const listeners = new Set<Listener>()
  return {
    getState: () => state,
    dispatch(action) {
      const next = reducer(state, action)
      // Bail when the reducer returns the same reference (no-op actions).
      if (Object.is(next, state)) return
      state = next
      for (const listener of listeners) listener()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    }
  }
}
// Only re-render when the selected value fails isEqual. Context cannot do this.
export function useStoreSelector<T, S>(
  store: Store<T>,
  selector: (state: T) => S,
  isEqual: (a: S, b: S) => boolean = Object.is
): S {
  const selectorRef = useRef(selector)
  selectorRef.current = selector
  const isEqualRef = useRef(isEqual)
  isEqualRef.current = isEqual
  const cache = useRef<{ snapshot: T; selected: S } | null>(null)
  const getSelection = useCallback((): S => {
    const snapshot = store.getState()
    const prev = cache.current
    if (prev !== null && Object.is(prev.snapshot, snapshot)) return prev.selected
    const selected = selectorRef.current(snapshot)
    if (prev !== null && isEqualRef.current(prev.selected, selected)) {
      cache.current = { snapshot, selected: prev.selected }
      return prev.selected
    }
    cache.current = { snapshot, selected }
    return selected
  }, [store])
  const subscribe = useCallback(
    (onStoreChange: Listener): Unsubscribe =>
      store.subscribe(() => {
        const prev = cache.current
        const snapshot = store.getState()
        const selected = selectorRef.current(snapshot)
        if (prev !== null && isEqualRef.current(prev.selected, selected)) {
          cache.current = { snapshot, selected: prev.selected }
          return
        }
        cache.current = { snapshot, selected }
        onStoreChange()
      }),
    [store]
  )
  return useSyncExternalStore(subscribe, getSelection, getSelection)
}
