import { addDays, formatDate, startOfWeek } from '../lib/date'
import type { Assignment, StudySession } from './models'

export type RangeWeeks = 4 | 8 | 12

export const CHART_RANGES: RangeWeeks[] = [4, 8, 12]

export type ChartPoint = {
  label: string
  value: number
  prev: number
}

export type MetricIcon = 'tasks' | 'hours' | 'accuracy' | 'cycle'

export type Metric = {
  id: string
  label: string
  value: number
  decimals?: number
  suffix?: string
  trend: {
    value: string
    positive: boolean
    direction: 'up' | 'down'
  }
  hint: string
  spark: number[]
  icon: MetricIcon
}

type DatedValue = {
  at: string
  value: number
}

function weekKey(value: string | Date): number {
  return startOfWeek(new Date(value)).getTime()
}

function buildWeeklySeries(
  events: DatedValue[],
  weeks: number,
  now: Date,
  round: boolean,
): ChartPoint[] {
  const currentStart = startOfWeek(now)
  const previousStart = addDays(currentStart, -weeks * 7)
  const current = new Map<number, number>()
  const previous = new Map<number, number>()

  for (const event of events) {
    const key = weekKey(event.at)
    const target =
      key >= currentStart.getTime()
        ? current
        : key >= previousStart.getTime()
          ? previous
          : null
    if (target) target.set(key, (target.get(key) ?? 0) + event.value)
  }

  return Array.from({ length: weeks }, (_, index) => {
    const start = addDays(currentStart, (index - (weeks - 1)) * 7)
    const previousWeek = addDays(start, -weeks * 7)
    const value = current.get(start.getTime()) ?? 0
    const prev = previous.get(previousWeek.getTime()) ?? 0
    return {
      label: formatDate(start),
      value: round ? Math.round(value * 10) / 10 : value,
      prev: round ? Math.round(prev * 10) / 10 : prev,
    }
  })
}

export function buildThroughputSeries(
  assignments: Assignment[],
  weeks: number = 12,
  now: Date = new Date(),
): ChartPoint[] {
  const events = assignments
    .filter((assignment) => assignment.completed && assignment.completedAt)
    .map((assignment) => ({ at: assignment.completedAt as string, value: 1 }))
  return buildWeeklySeries(events, weeks, now, false)
}

export function buildHoursSeries(
  sessions: StudySession[],
  weeks: number = 12,
  now: Date = new Date(),
): ChartPoint[] {
  const events = sessions.map((session) => ({
    at: session.date,
    value: session.minutes / 60,
  }))
  return buildWeeklySeries(events, weeks, now, true)
}
