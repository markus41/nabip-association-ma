/**
 * Theme Provider for NABIP AMS
 *
 * Establishes a scalable theme management system supporting light/dark modes with persistent
 * user preferences. Designed to streamline visual consistency across multi-tenant association
 * management workflows while supporting accessibility requirements.
 *
 * Best for: Organizations requiring customizable branding with system-wide theme switching
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

interface ThemeProviderState {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  resolvedTheme: 'light',
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

/**
 * ThemeProvider component establishes theme context for the entire application.
 * Automatically syncs with system preferences and persists user selections to local storage.
 *
 * @param defaultTheme - Initial theme setting (defaults to 'system')
 * @param storageKey - LocalStorage key for theme persistence (defaults to 'nabip-ams-theme')
 * @param children - React children to render within theme context
 *
 * @example
 * ```tsx
 * <ThemeProvider defaultTheme="system" storageKey="nabip-ams-theme">
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'nabip-ams-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const root = window.document.documentElement

    // Remove existing theme classes
    root.classList.remove('light', 'dark')

    // Resolve system preference if theme is 'system'
    let effectiveTheme: 'light' | 'dark'
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      effectiveTheme = systemTheme
    } else {
      effectiveTheme = theme
    }

    // Apply resolved theme
    root.classList.add(effectiveTheme)
    setResolvedTheme(effectiveTheme)
  }, [theme])

  /**
   * Listen for system theme changes when theme is set to 'system'
   * Ensures automatic updates when user changes OS-level dark mode preference
   */
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')
      const systemTheme = e.matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
      setResolvedTheme(systemTheme)
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
    resolvedTheme,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

/**
 * Hook to access theme context from any component within the ThemeProvider tree.
 * Provides current theme, theme setter, and resolved theme (accounting for system preference).
 *
 * @throws Error if used outside of ThemeProvider context
 *
 * @example
 * ```tsx
 * const { theme, setTheme, resolvedTheme } = useTheme()
 *
 * // Toggle between light and dark
 * <button onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}>
 *   Toggle Theme
 * </button>
 * ```
 */
export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
