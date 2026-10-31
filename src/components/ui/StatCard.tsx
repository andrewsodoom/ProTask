import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

type StatCardProps = {
  label: string
  value: string | number
  icon: LucideIcon
  hint?: string
  accent?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose'
  className?: string
}

const accents = {
  cyan: 'border-accent/15 bg-accent/[0.07] text-accent',
  violet: 'border-violet-400/15 bg-violet-400/[0.07] text-violet-300',
  emerald: 'border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300',
  amber: 'border-amber-400/15 bg-amber-400/[0.07] text-amber-200',
  rose: 'border-rose-400/15 bg-rose-400/[0.07] text-rose-300',
}

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = 'cyan',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-line bg-gradient-to-b from-surface to-surface-2 p-4 backdrop-blur-xl',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-faint">
          {label}
        </p>
        <span
          className={cn(
            'grid size-7 shrink-0 place-items-center rounded-lg border',
            accents[accent],
          )}
        >
          <Icon size={13} />
        </span>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink tabular-nums">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-faint">{hint}</p>}
    </div>
  )
}
