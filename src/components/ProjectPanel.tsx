import { Link } from 'react-router-dom'
import { ArrowUpRight, FolderKanban } from 'lucide-react'
import { useData } from '../context/DataContext'
import { compactCountdown, formatDate, timeUntil } from '../lib/date'
import { STATUS_TONE, TONE_STYLES } from '../lib/tone'
import { Badge } from './ui/Badge'
import { EmptyState } from './ui/EmptyState'

export function ProjectPanel() {
  const { projects } = useData()

  const active = [...projects]
    .filter((project) => project.status !== 'Shipped')
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, 3)

  return (
    <section
      className="fade-up min-w-0 rounded-2xl border border-line bg-gradient-to-b from-surface to-surface-2 p-5 backdrop-blur-xl transition duration-300 hover:border-accent/20 sm:p-6"
      style={{ animationDelay: '420ms' }}
      aria-labelledby="projects-heading"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-accent/70">
            Builds
          </p>
          <h2
            id="projects-heading"
            className="mt-1 font-display text-lg font-semibold tracking-tight text-ink"
          >
            Active projects
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1 text-[10px] font-medium text-muted">
          <span className="size-1.5 animate-pulse rounded-full bg-accent shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
          {active.length} in flight
        </span>
      </div>

      {active.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No active builds"
          description="Add your first project with a deadline and estimated hours to start tracking momentum."
          className="mt-5 border-line py-8"
          action={
            <Link
              to="/projects"
              className="inline-flex items-center gap-1.5 rounded-lg border border-accent/20 bg-accent/10 px-3 py-1.5 text-[11px] font-medium text-accent transition hover:bg-accent/15"
            >
              Create a project
              <ArrowUpRight size={12} />
            </Link>
          }
        />
      ) : (
        <div className="mt-5 divide-y divide-line">
          {active.map((project) => {
            const tone = TONE_STYLES[project.tone]
            const countdown = timeUntil(project.dueAt)
            const dueText = countdown.overdue
              ? `Overdue by ${compactCountdown(countdown)}`
              : countdown.days === 0
                ? 'Due today'
                : `${countdown.days}d left`
            return (
              <Link
                key={project.id}
                to="/projects"
                className="group block py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`grid size-9 shrink-0 place-items-center rounded-xl border ${tone.icon}`}
                  >
                    <FolderKanban size={16} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">
                          {project.name}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-faint">
                          {project.stack.join(' · ')}
                        </p>
                      </div>
                      <Badge tone={STATUS_TONE[project.status]}>{project.status}</Badge>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${tone.bar} ${tone.glow}`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="w-8 text-right font-mono text-[11px] text-muted tabular-nums">
                        {project.progress}%
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-faint">
                      <span>
                        Due {formatDate(project.dueAt)}
                        <span className="mx-1 text-subtle">·</span>
                        <span className={countdown.overdue ? 'text-rose-300' : ''}>
                          {dueText}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 transition group-hover:text-accent">
                        Open
                        <ArrowUpRight size={11} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <Link
        to="/projects"
        className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-line bg-surface-2 py-2 text-[11px] font-medium text-muted transition hover:border-accent/20 hover:bg-accent/[0.05] hover:text-accent"
      >
        Manage projects
        <ArrowUpRight size={12} />
      </Link>
    </section>
  )
}
