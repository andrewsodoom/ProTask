import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../lib/utils'

type ThemeToggleProps = {
  className?: string
  withLabel?: boolean
}

export function ThemeToggle({ className, withLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  const Icon = theme === 'dark' ? Sun : Moon

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      data-testid="theme-toggle"
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-line bg-surface text-muted transition hover:border-line-strong hover:bg-surface-3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30',
        withLabel ? 'h-9 px-3 text-[11px] font-medium' : 'size-8',
        className,
      )}
    >
      <Icon size={14} />
      {withLabel && <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  )
}
