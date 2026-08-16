export type RovingKey = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'Home' | 'End'

export function nextRovingIndex(opts: {
  length: number
  current: number
  key: RovingKey
  orientation?: 'horizontal' | 'vertical'
  loop?: boolean
}): number {
  const { length, current, key, orientation = 'horizontal', loop = true } = opts
  if (length <= 0 || current < 0 || current >= length) return 0
  if (key === 'Home') return 0
  if (key === 'End') return length - 1

  const horizontal = orientation === 'horizontal'
  const next = horizontal ? key === 'ArrowRight' : key === 'ArrowDown'
  const prev = horizontal ? key === 'ArrowLeft' : key === 'ArrowUp'
  if (!next && !prev) return current
  if (next) return current === length - 1 ? (loop ? 0 : current) : current + 1
  return current === 0 ? (loop ? length - 1 : current) : current - 1
}
