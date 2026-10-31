import { Link } from 'react-router-dom'
import { ArrowUpRight, Check, ListChecks } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { compactCountdown, formatDateTime, timeUntil } from '../lib/date'
import { PRIORITY_DOT, PRIORITY_TONE } from '../lib/tone'
import { Badge } from './ui/Badge'
import { EmptyState } from './ui/EmptyState'

export function TaskPanel() {
  const { assignments, toggleAssignment } = useData()
  const { notify } = useToast()

  const open = [...assignments]
    .filter((assignment) => !assignment.completed)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
  const next = open.slice(0, 5)
  const done = assignments.filter((assignment) => assignment.completed).length

  const complete = async (id: string) => {
    const assignment = assignments.find((entry) => entry.id === id)
    try {
      await toggleAssignment(id)
      if (assignment) {
        notify({
          title: 'Assignment completed',
          description: assignment.title,
          variant: 'success',
        })
      }
    } catch (cause) {
      notify({
        title: 'Could not update assignment',
        description: cause instanceof Error ? cause.message : 'Try again.',
        variant: 'error',
      })
    }
  }

  return (
    <section
      className="fade-up flex h-full min-w-0 flex-col rounded-2xl border border-line bg-gradient-to-b from-surface to-surface-2 p-5 backdrop-blur-xl transition duration-300 hover:border-accent/20 sm:p-6"
      style={{ animationDelay: '490ms' }}
      aria-labelledby="tasks-heading"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-accent/70">
            Next up
          </p>
          <h2
            id="tasks-heading"
            className="mt-1 font-display text-lg font-semibold tracking-tight text-ink"
          >
            Academic queue
          </h2>
        </div>
        <span className="rounded-lg border border-line bg-surface px-2.5 py-1 font-mono text-[10px] text-muted tabular-nums">
          {open.length} open
        </span>
      </div>

      {next.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Queue is clear"
          description="Every assignment is complete. Add the next deadline so it stays visible."
          className="mt-5 flex-1 border-line py-8"
          action={
            <Link
              to="/academic"
              className="inline-flex items-center gap-1.5 rounded-lg border border-accent/20 bg-accent/10 px-3 py-1.5 text-[11px] font-medium text-accent transition hover:bg-accent/15"
            >
              Add an assignment
              <ArrowUpRight size={12} />
            </Link>
          }
        />
      ) : (
        <ul className="mt-4 flex-1 space-y-0.5">
          {next.map((assignment) => {
            const countdown = timeUntil(assignment.dueAt)
            const overdue = countdown.overdue
            const days = countdown.days
            const dueText = overdue
              ? `Overdue by ${compactCountdown(countdown)}`
              : days === 0
                ? 'Due today'
                : `In ${days}d`
            return (
              <li key={assignment.id}>
                <div className="group flex items-start gap-3 rounded-xl border border-transparent px-2 py-2.5 transition hover:border-line hover:bg-surface">
                  <button
                    type="button"
                    onClick={() => complete(assignment.id)}
                    aria-label={`Mark ${assignment.title} complete`}
                    className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-line-strong text-transparent transition hover:border-accent/70 hover:text-accent"
                  >
                    <Check size={12} strokeWidth={3} />
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug text-ink">
                      {assignment.title}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-faint">
                      <span className="font-mono text-[10px] tracking-wide">
                        {assignment.course}
                      </span>
                      <span className="size-0.5 rounded-full bg-subtle" />
                      <span>{formatDateTime(assignment.dueAt)}</span>
                      <span className="size-0.5 rounded-full bg-subtle" />
                      <span className={overdue ? 'text-rose-300' : ''}>{dueText}</span>
                    </p>
                  </div>

                  <Badge tone={PRIORITY_TONE[assignment.priority]} className="mt-0.5">
                    <span className={`size-1 rounded-full ${PRIORITY_DOT[assignment.priority]}`} />
                    {assignment.priority}
                  </Badge>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-[11px]">
        <span className="text-faint">
          {done} completed
          <span className="mx-1.5 text-subtle">·</span>
          {assignments.length} total
        </span>
        <Link
          to="/academic"
          className="flex items-center gap-1 font-medium text-muted transition hover:text-accent"
        >
          Open queue
          <ArrowUpRight size={12} />
        </Link>
      </div>
    </section>
  )
}
