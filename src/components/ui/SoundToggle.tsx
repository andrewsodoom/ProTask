import { Volume2, VolumeX } from 'lucide-react'
import { useSound } from '../../context/SoundContext'
import { cn } from '../../lib/utils'

type SoundToggleProps = {
  className?: string
}

export function SoundToggle({ className }: SoundToggleProps) {
  const { enabled, toggle } = useSound()
  const Icon = enabled ? Volume2 : VolumeX

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={enabled ? 'Turn off click sounds' : 'Turn on click sounds'}
      aria-pressed={enabled}
      title={enabled ? 'Click sounds on' : 'Click sounds off'}
      data-testid="sound-toggle"
      className={cn(
        'inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-3 text-[11px] font-medium text-muted transition hover:border-line-strong hover:bg-surface-3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30',
        className,
      )}
    >
      <Icon size={14} />
      <span>{enabled ? 'Sound on' : 'Sound off'}</span>
    </button>
  )
}
