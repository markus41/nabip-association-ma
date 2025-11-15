/**
 * Theme Toggle Component for NABIP AMS
 *
 * Provides accessible theme switching functionality supporting light, dark, and system preferences.
 * Designed to streamline user experience while maintaining WCAG 2.1 AA accessibility standards.
 *
 * Best for: Applications requiring user-controlled theme preferences with persistent storage
 */

import { Moon, Sun, Monitor } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/lib/theme-provider'

/**
 * ThemeToggle - Dropdown menu component for theme selection
 *
 * Displays current theme with appropriate icon and provides accessible menu for switching
 * between light, dark, and system theme preferences. Persists selection to localStorage.
 *
 * @example
 * ```tsx
 * // In application header
 * <header className="flex items-center justify-between">
 *   <Logo />
 *   <ThemeToggle />
 * </header>
 * ```
 */
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Toggle theme"
          className="relative"
        >
          <Sun
            size={20}
            weight="regular"
            className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
            aria-hidden="true"
          />
          <Moon
            size={20}
            weight="regular"
            className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
            aria-hidden="true"
          />
          <span className="sr-only">Toggle theme menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="cursor-pointer"
        >
          <Sun size={16} weight="regular" className="mr-2" aria-hidden="true" />
          <span>Light</span>
          {theme === 'light' && (
            <span className="ml-auto text-xs text-muted-foreground">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="cursor-pointer"
        >
          <Moon size={16} weight="regular" className="mr-2" aria-hidden="true" />
          <span>Dark</span>
          {theme === 'dark' && (
            <span className="ml-auto text-xs text-muted-foreground">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="cursor-pointer"
        >
          <Monitor size={16} weight="regular" className="mr-2" aria-hidden="true" />
          <span>System</span>
          {theme === 'system' && (
            <span className="ml-auto text-xs text-muted-foreground">✓</span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * SimpleThemeToggle - Basic toggle button for light/dark switching
 *
 * Streamlined version without system preference option. Provides quick toggle
 * between light and dark modes with single click interaction.
 *
 * Best for: Simple theme switching without system preference complexity
 *
 * @example
 * ```tsx
 * <SimpleThemeToggle />
 * ```
 */
export function SimpleThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light')
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} theme`}
    >
      <Sun
        size={20}
        weight="regular"
        className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
        aria-hidden="true"
      />
      <Moon
        size={20}
        weight="regular"
        className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        aria-hidden="true"
      />
      <span className="sr-only">
        {resolvedTheme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
      </span>
    </Button>
  )
}
