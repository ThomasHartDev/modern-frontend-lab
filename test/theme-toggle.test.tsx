import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from '@/tokens/theme-toggle'
import { THEME_STORAGE_KEY } from '@/tokens'

function mockMatchMedia(matchesDark: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: matchesDark && query.includes('prefers-color-scheme: dark'),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false
    })
  })
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    mockMatchMedia(true)
  })

  it('renders light, dark, and system controls', () => {
    render(<ThemeToggle />)
    expect(screen.getByRole('group', { name: 'Color theme' })).toBeInTheDocument()
    for (const name of ['light', 'dark', 'system']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
  })

  it('sets data-theme and persists light, then clears for system', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)
    await user.click(screen.getByRole('button', { name: 'light' }))
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(screen.getByRole('button', { name: 'light' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'system' }))
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
    expect(screen.getByRole('button', { name: 'system' })).toHaveAttribute('aria-pressed', 'true')
  })
})
