import { Link } from 'react-router-dom'
import { CalendarDays, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { MetricCard } from '../components/MetricCard'
import { MomentumSection } from '../components/MomentumSection'
import { ProjectPanel } from '../components/ProjectPanel'
import { TaskPanel } from '../components/TaskPanel'
import { buttonStyles } from '../components/ui/Button'
import {
  buildHoursSeries,
  buildThroughputSeries,
} from '../data/analytics'
import type { Metric } from '../data/analytics'
import { formatDate, greeting, isThisWeek } from '../lib/date'

export function OverviewPage() {
  const { user } = useAuth()
  const { assignments, sessions } = useData()

  const firstName = user?.name.split(' ')[0] ?? 'there'
  const completed = assignments.filter((assignment) => assignment.completed)
  const onTime = completed.filter(
    (assignment) =>
      assignment.completedAt &&
      new Date(assignment.completedAt).getTime() <= new Date(assignment.dueAt).getTime(),
  ).length
  const totalMinutes = sessions.reduce((total, session) => total + session.minutes, 0)

  const tasksValue = completed.length
  const hoursValue = totalMinutes / 60
  const accuracy = completed.length
    ? Math.round((onTime / completed.length) * 100)
    : 0
  const cycle = completed.length
    ? completed.reduce((total, assignment) => {
        if (!assignment.completedAt) return total
        const days =
          (new Date(assignment.completedAt).getTime() - new Date(assignment.createdAt).getTime()) /
          86_400_000
        return total + Math.max(0, days)
      }, 0) / completed.length
    : 0

  const throughput = buildThroughputSeries(assignments)
  const hours = buildHoursSeries(sessions)
  const throughputSpark = throughput.map((point) => point.value)
  const hoursSpark = hours.map((point) => point.value)
  const flatAccuracySpark = throughput.map(() => accuracy)
  const flatCycleSpark = throughput.map(() => cycle)

  const metrics: Metric[] = [
    {
      id: 'tasks',
      label: 'Tasks completed',
      value: tasksValue,
      trend: { value: 'Live', positive: true, direction: 'up' },
      hint: 'all time',
      spark: throughputSpark,
      icon: 'tasks',
    },
    {
      id: 'hours',
      label: 'Hours tracked',
      value: hoursValue,
      decimals: Number.isInteger(hoursValue) ? 0 : 1,
      trend: { value: 'Live', positive: true, direction: 'up' },
      hint: 'all time',
      spark: hoursSpark,
      icon: 'hours',
    },
    {
      id: 'accuracy',
      label: 'Delivery accuracy',
      value: accuracy,
      suffix: '%',
      trend: { value: 'Live', positive: true, direction: 'up' },
      hint: 'completed on time',
      spark: flatAccuracySpark,
      icon: 'accuracy',
    },
    {
      id: 'cycle',
      label: 'Average cycle time',
      value: cycle,
      decimals: 1,
      suffix: 'd',
      trend: { value: 'Live', positive: true, direction: 'down' },
      hint: 'creation to completion',
      spark: flatCycleSpark,
      icon: 'cycle',
    },
  ]


  const dueThisWeek = assignments.filter(
    (assignment) => !assignment.completed && isThisWeek(assignment.dueAt),
  ).length
  const weekMinutes = sessions
    .filter((session) => isThisWeek(session.date))
    .reduce((total, session) => total + session.minutes, 0)

  return (
    <>
      <header className="fade-up">
        <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-accent/80">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
          </span>
          Live workspace
        </div>

        <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-[2.15rem]">
              {greeting()}, {firstName}
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
              You have{' '}
              <span className="text-ink">{dueThisWeek} deadlines</span> left this
              week and{' '}
              <span className="text-ink">
                {Math.round(weekMinutes / 60)}h of focus
              </span>{' '}
              logged. Small, consistent sessions compound.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2 text-xs font-medium text-ink-soft">
              <CalendarDays size={14} className="text-faint" />
              {formatDate(new Date(), true)}
            </span>
            <Link to="/study-log" className={buttonStyles('primary', 'md')}>
              <Plus size={15} strokeWidth={2.6} />
              Log session
            </Link>
          </div>
        </div>
      </header>

      <section className="mt-8" aria-labelledby="snapshot-heading">
        <div className="flex items-end justify-between gap-4">
          <h2
            id="snapshot-heading"
            className="text-[10px] font-medium uppercase tracking-[0.2em] text-faint"
          >
            Term snapshot
          </h2>
          <span className="font-mono text-[10px] text-faint">live · synced to cloud</span>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric, index) => (
            <MetricCard key={metric.id} metric={metric} index={index} />
          ))}
        </div>
      </section>

      <MomentumSection throughput={throughput} hours={hours} />

      <section
        className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.05fr_0.95fr]"
        aria-label="Projects and academic tasks"
      >
        <ProjectPanel />
        <TaskPanel />
      </section>
    </>
  )
}
