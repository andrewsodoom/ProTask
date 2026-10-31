import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface-2 px-6 py-12 text-center',
        className,
      )}
    >
      <div className="grid size-11 place-items-center rounded-xl border border-accent/15 bg-accent/[0.06] text-accent">
        <Icon size={19} />
      </div>
      <p className="mt-4 font-display text-base font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-faint">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
