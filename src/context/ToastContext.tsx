import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { cn, uid } from '../lib/utils'

type ToastVariant = 'success' | 'error' | 'info'

type ToastInput = {
  title: string
  description?: string
  variant?: ToastVariant
}

type ToastItem = ToastInput & { id: string; variant: ToastVariant }

type ToastContextValue = {
  notify: (input: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const styles: Record<ToastVariant, { icon: string; border: string; bar: string }> = {
  success: {
    icon: 'text-emerald-300',
    border: 'border-emerald-400/20',
    bar: 'bg-emerald-400',
  },
  error: {
    icon: 'text-rose-300',
    border: 'border-rose-400/20',
    bar: 'bg-rose-400',
  },
  info: {
    icon: 'text-accent',
    border: 'border-accent/20',
    bar: 'bg-accent',
  },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const notify = useCallback(
    (input: ToastInput) => {
      const item: ToastItem = {
        ...input,
        id: uid('toast'),
        variant: input.variant ?? 'success',
      }
      setToasts((current) => [...current.slice(-3), item])
      const timer = setTimeout(() => dismiss(item.id), 3800)
      timers.current.set(item.id, timer)
    },
    [dismiss],
  )

  useEffect(() => {
    const current = timers.current
    return () => {
      current.forEach((timer) => clearTimeout(timer))
      current.clear()
    }
  }, [])

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-24 z-[90] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = icons[toast.variant]
            const style = styles[toast.variant]
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className={cn(
                  'pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-xl border bg-panel/95 p-3.5 pr-10 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.95)] backdrop-blur-xl',
                  style.border,
                )}
              >
                <span className={cn('absolute inset-y-0 left-0 w-0.5', style.bar)} />
                <div className="flex items-start gap-2.5">
                  <Icon size={16} className={cn('mt-0.5 shrink-0', style.icon)} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{toast.title}</p>
                    {toast.description && (
                      <p className="mt-0.5 text-xs leading-relaxed text-muted">
                        {toast.description}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss notification"
                  className="absolute right-2.5 top-2.5 grid size-6 place-items-center rounded-md text-faint transition hover:bg-surface-3 hover:text-ink"
                >
                  <X size={13} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
