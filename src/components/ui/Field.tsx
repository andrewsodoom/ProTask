import { useEffect, useId, useRef, useState } from 'react'
import type {
  InputHTMLAttributes,
  KeyboardEvent,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

export const inputClass =
  'h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink placeholder:text-subtle outline-none transition focus:border-accent/40 focus:bg-surface-3 focus:ring-2 focus:ring-accent/10'

export const textareaClass =
  'min-h-24 w-full resize-y rounded-xl border border-line bg-surface px-3 py-2.5 text-sm leading-relaxed text-ink placeholder:text-subtle outline-none transition focus:border-accent/40 focus:bg-surface-3 focus:ring-2 focus:ring-accent/10'

export const selectClass =
  'flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3 text-left text-sm text-ink outline-none transition focus:border-accent/40 focus:bg-surface-3 focus:ring-2 focus:ring-accent/10 disabled:cursor-not-allowed disabled:opacity-50'

type FieldProps = {
  label: string
  htmlFor?: string
  error?: string
  hint?: string
  children: ReactNode
  className?: string
}

export function Field({ label, htmlFor, error, hint, children, className }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-[11px] font-medium uppercase tracking-[0.14em] text-muted"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[11px] text-rose-300">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-faint">{hint}</p>
      ) : null}
    </div>
  )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...props} />
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(textareaClass, className)} {...props} />
}

export type SelectOption<T extends string> = {
  value: T
  label: string
}

type SelectProps<T extends string> = {
  id?: string
  value: T
  onChange: (value: T) => void
  options: ReadonlyArray<SelectOption<T>>
  placeholder?: string
  className?: string
  disabled?: boolean
  ariaLabel?: string
}

type MenuPosition = {
  top?: number
  bottom?: number
  left: number
  width: number
  maxHeight: number
}

export function Select<T extends string>({
  id,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  className,
  disabled = false,
  ariaLabel,
}: SelectProps<T>) {
  const generatedId = useId()
  const triggerId = id ?? `select-${generatedId}`
  const listboxId = `${triggerId}-listbox`
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [position, setPosition] = useState<MenuPosition | null>(null)

  const selectedIndex = options.findIndex((option) => option.value === value)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined

  const openMenu = () => {
    if (disabled || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom - 16
    const spaceAbove = rect.top - 16
    const openAbove = spaceBelow < 220 && spaceAbove > spaceBelow
    const maxHeight = Math.min(280, Math.max(120, openAbove ? spaceAbove : spaceBelow))

    setPosition({
      top: openAbove ? undefined : rect.bottom + 6,
      bottom: openAbove ? window.innerHeight - rect.top + 6 : undefined,
      left: Math.min(rect.left, window.innerWidth - rect.width - 12),
      width: rect.width,
      maxHeight,
    })
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    setOpen(true)
  }

  const closeMenu = (restoreFocus = false) => {
    setOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }

  const choose = (index: number) => {
    const option = options[index]
    if (!option) return
    onChange(option.value)
    closeMenu(true)
  }

  const move = (direction: 1 | -1) => {
    if (!options.length) return
    setActiveIndex((current) => (current + direction + options.length) % options.length)
  }

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const onViewportChange = () => setOpen(false)

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('resize', onViewportChange)
    window.addEventListener('scroll', onViewportChange, true)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('resize', onViewportChange)
      window.removeEventListener('scroll', onViewportChange, true)
    }
  }, [open])

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (open) move(1)
        else openMenu()
        break
      case 'ArrowUp':
        event.preventDefault()
        if (open) move(-1)
        else openMenu()
        break
      case 'Home':
        if (!open) return
        event.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        if (!open) return
        event.preventDefault()
        setActiveIndex(options.length - 1)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (open) choose(activeIndex)
        else openMenu()
        break
      case 'Escape':
        if (open) {
          event.preventDefault()
          closeMenu(true)
        }
        break
      case 'Tab':
        closeMenu()
        break
      default:
        break
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-activedescendant={open ? `${listboxId}-option-${activeIndex}` : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={onKeyDown}
        className={cn(selectClass, className)}
      >
        <span className={cn('truncate', !selected && 'text-subtle')}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={14}
          className={cn('shrink-0 text-faint transition', open && 'rotate-180 text-accent')}
        />
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={triggerId}
            className="animate-dropdown-in fixed z-[220] overflow-y-auto rounded-xl border border-line-strong bg-panel p-1 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.65)] backdrop-blur-xl"
            style={{
              top: position.top,
              bottom: position.bottom,
              left: position.left,
              width: position.width,
              maxHeight: position.maxHeight,
            }}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value
              const isActive = index === activeIndex
              return (
                <button
                  key={option.value}
                  id={`${listboxId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={-1}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(index)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-xs transition',
                    isActive ? 'bg-accent/10 text-ink' : 'text-muted hover:bg-surface-3 hover:text-ink',
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check size={13} className="shrink-0 text-accent" />}
                </button>
              )
            })}
          </div>,
          document.body,
        )}
    </>
  )
}
