import { MoonIcon, SunIcon } from 'lucide-react'

import { IconButton } from '@/components/icon-button'
import { useTheme } from '@/lib/theme'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <IconButton
      label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      icon={
        isDark ? (
          <MoonIcon className="size-[18px]" strokeWidth={1.75} />
        ) : (
          <SunIcon className="size-[18px]" strokeWidth={1.75} />
        )
      }
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    />
  )
}
