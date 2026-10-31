import type { ReactNode } from 'react'

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="fade-up">
      {eyebrow && (
        <p className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-accent/80">
          <span className="size-1 rounded-full bg-accent shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
          {eyebrow}
        </p>
      )}
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-[2.15rem]">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
      </div>
    </header>
  )
}
