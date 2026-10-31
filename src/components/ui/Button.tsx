import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-accent to-accent-strong text-accent-contrast shadow-[0_0_26px_-6px_rgba(34,211,238,0.85)] hover:from-accent-strong hover:to-accent hover:shadow-[0_0_34px_-4px_rgba(34,211,238,0.95)]',
  secondary:
    'border border-line bg-surface text-ink hover:border-line-strong hover:bg-surface-3 hover:text-ink',
  ghost: 'text-muted hover:bg-surface-3 hover:text-ink',
  danger:
    'border border-rose-400/20 bg-rose-400/10 text-rose-300 hover:border-rose-400/30 hover:bg-rose-400/15',
  subtle:
    'border border-accent/20 bg-accent/[0.08] text-accent hover:border-accent/35 hover:bg-accent/[0.13]',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-2.5 text-[11px]',
  md: 'h-10 gap-2 rounded-xl px-4 text-xs',
  lg: 'h-11 gap-2 rounded-xl px-5 text-sm',
  icon: 'size-9 rounded-lg',
}

export function buttonStyles(variant: Variant = 'secondary', size: Size = 'md'): string {
  return cn(
    'inline-flex select-none items-center justify-center font-medium transition duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(buttonStyles(variant, size), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}
