import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

export type SegmentedOption<T extends string> = {
  value: T
  label: string
  count?: number
}

type SegmentedProps<T extends string> = {
  options: ReadonlyArray<SegmentedOption<T>>
  value: T
  onChange: (value: T) => void
  id: string
  className?: string
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  id,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      className={cn(
        'inline-flex flex-wrap items-center gap-0.5 rounded-xl border border-line bg-surface p-0.5',
        className,
      )}
      role="group"
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              'relative rounded-[10px] px-3 py-1.5 text-[11px] font-medium transition',
              active ? 'text-accent' : 'text-faint hover:text-ink-soft',
            )}
          >
            {active && (
              <motion.span
                layoutId={`segmented-${id}`}
                className="absolute inset-0 rounded-[10px] bg-accent/[0.13] shadow-[inset_0_0_0_1px_rgba(34,211,238,0.28)]"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {option.label}
              {typeof option.count === 'number' && (
                <span
                  className={cn(
                    'rounded px-1 py-0.5 font-mono text-[9px]',
                    active ? 'bg-accent/15 text-accent' : 'bg-surface-3 text-faint',
                  )}
                >
                  {option.count}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
