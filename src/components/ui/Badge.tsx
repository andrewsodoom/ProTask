import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export type BadgeTone = 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate'

const tones: Record<BadgeTone, string> = {
  cyan: 'border-accent/20 bg-accent/10 text-accent',
  violet: 'border-violet-400/20 bg-violet-400/10 text-violet-300',
  emerald: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  amber: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
  rose: 'border-rose-400/20 bg-rose-400/10 text-rose-300',
  slate: 'border-line bg-surface-3 text-muted',
}

type BadgeProps = {
  tone?: BadgeTone
  children: ReactNode
  className?: string
  dot?: boolean
}

export function Badge({ tone = 'slate', children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[10px] font-medium',
        tones[tone],
        className,
      )}
    >
      {dot && <span className="size-1 rounded-full bg-current" />}
      {children}
    </span>
  )
}
