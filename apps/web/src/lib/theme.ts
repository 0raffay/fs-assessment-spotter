import { useSyncExternalStore } from 'react'

export const THEMES = ['dark', 'light'] as const
export type Theme = (typeof THEMES)[number]

const STORAGE_KEY = 'skyrig-theme'
const DEFAULT_THEME: Theme = 'dark'
const listeners = new Set<() => void>()

function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value)
}

function readStoredTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return isTheme(stored) ? stored : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

let current: Theme = typeof window === 'undefined' ? DEFAULT_THEME : readStoredTheme()

/** Puts the theme class on <html> (Tailwind's `dark` variant) and the matching color-scheme. */
export function applyTheme(theme: Theme = current): void {
  const root = document.documentElement
  root.classList.remove(...THEMES)
  root.classList.add(theme)
  root.style.colorScheme = theme
}

export function setTheme(theme: Theme): void {
  current = theme
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Storage can be blocked; the theme still applies for this visit.
  }
  applyTheme(theme)
  listeners.forEach((listener) => listener())
}

/** Dark-first theme store (DESIGN.md: dark is the default, light is supported). */
export function useTheme(): { theme: Theme; setTheme: (theme: Theme) => void } {
  const theme = useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => current,
    () => DEFAULT_THEME,
  )
  return { theme, setTheme }
}
