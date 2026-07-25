export interface ListItem {
  id: string
  label: string
  category: string
  score: number
}

const CATEGORIES = ['alpha', 'beta', 'gamma', 'delta'] as const

export function createListItems(count: number): ListItem[] {
  const n = Math.max(0, Math.floor(count))
  const items: ListItem[] = new Array(n)
  for (let i = 0; i < n; i += 1) {
    items[i] = {
      id: `row-${i}`,
      label: `Item ${i + 1}`,
      category: CATEGORIES[i % CATEGORIES.length] ?? 'alpha',
      score: ((i * 17) % 100) + 1
    }
  }
  return items
}
