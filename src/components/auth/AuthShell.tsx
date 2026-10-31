import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  FolderKanban,
  Layers,
  ShieldCheck,
  Timer,
} from 'lucide-react'
import { ThemeToggle } from '../ui/ThemeToggle'

const features = [
  { icon: Timer, label: 'Focus timer and study log' },
  { icon: CalendarDays, label: 'Timetable with deadline timers' },
  { icon: FolderKanban, label: 'Projects with real dates and hours' },
  { icon: ShieldCheck, label: 'Private, cloud-synced workspace' },
]

const safeguards = ['Supabase Auth', 'Row-level security', 'Encrypted in transit']

type AuthShellProps = {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas">
      <div className="absolute right-5 top-5 z-20 sm:right-8 sm:top-8">
        <ThemeToggle withLabel />
      </div>
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -right-32 -top-40 size-[34rem] rounded-full bg-accent/[0.12] blur-[120px]" />
        <div className="absolute -bottom-48 -left-32 size-[30rem] rounded-full bg-indigo-500/[0.12] blur-[120px]" />
        <div className="ambient-grid absolute inset-0 opacity-50" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl items-center gap-12 px-5 py-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
        <div className="hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-accent via-accent to-sky-600 shadow-[0_0_30px_-6px_rgba(34,211,238,0.9)]">
              <Layers size={19} strokeWidth={2.4} className="text-accent-contrast" />
            </div>
            <div>
              <p className="font-display text-base font-semibold tracking-tight text-ink">
                ProTask
              </p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-faint">
                Plan & build 
              </p>
            </div>
          </div>

          <h2 className="mt-12 max-w-md font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink xl:text-5xl">
            Track the work.
            <br />
            <span className="bg-gradient-to-r from-accent-strong via-accent to-teal-300 bg-clip-text text-transparent">
              Own the term.
            </span>
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
            One neon workspace for lectures, assignments, side projects and the deep work
            that connects them. Built to keep deadlines visible and momentum honest.
          </p>

          <div className="mt-8 grid max-w-md grid-cols-2 gap-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.label}
                  className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2 px-3 py-2.5"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-accent/15 bg-accent/[0.07] text-accent">
                    <Icon size={13} />
                  </span>
                  <span className="text-[11px] leading-snug text-ink-soft">
                    {feature.label}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="relative mt-8 max-w-md overflow-hidden rounded-2xl border border-line bg-panel/80 p-4 backdrop-blur-xl">
            <div className="absolute -right-16 -top-20 size-40 rounded-full bg-accent/10 blur-3xl" />
            <div className="relative">
              <p className="text-[10px] uppercase tracking-[0.18em] text-faint">
                Your workspace
              </p>
              <p className="mt-1 font-display text-xl font-semibold text-ink">
                Cloud synced
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                Projects, deadlines and sessions follow you across devices.
              </p>
            </div>
            <div className="relative mt-4 grid gap-2">
              {safeguards.map((label) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-[10px] text-ink-soft"
                >
                  <span>{label}</span>
                  <ShieldCheck size={12} className="text-emerald-300" />
                </div>
              ))}
            </div>
            <div className="relative mt-3 flex items-center justify-between border-t border-line pt-3 text-[10px] text-faint">
              <span>Private by default</span>
              <span className="flex items-center gap-1.5 text-muted">
                <span className="size-1 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
                Live sync
              </span>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-accent via-accent to-sky-600 shadow-[0_0_30px_-6px_rgba(34,211,238,0.9)]">
              <Layers size={19} strokeWidth={2.4} className="text-accent-contrast" />
            </div>
            <div>
              <p className="font-display text-base font-semibold tracking-tight text-ink">
                  ProTask
              </p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-faint">
                Plan & build
              </p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-line bg-panel/85 p-6 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)] backdrop-blur-2xl sm:p-8"
          >
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
              {title}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </motion.div>

          <div className="mt-6 text-center text-xs text-faint">{footer}</div>
          <p className="mt-3 text-center text-[10px] leading-relaxed text-faint">
            Authentication and workspace data are secured by Supabase.
          </p>
        </div>
      </div>
    </div>
  )
}
