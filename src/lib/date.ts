const pad = (value: number) => String(value).padStart(2, '0')

export const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const DAYS_LONG = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

export function asDate(value: string | Date): Date {
  if (value instanceof Date) return value
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00`)
  return new Date(value)
}

export function toDateInput(value: string | Date): string {
  const date = typeof value === 'string' ? asDate(value) : value
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function toDateTimeInput(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function fromDateTimeInput(value: string): string {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

export function formatDate(value: string | Date, withYear = false): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
  }).format(asDate(value))
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatTimeString(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function formatDateRange(startDate: string, dueAt: string): string {
  return `${formatDate(startDate)} – ${formatDate(dueAt)}`
}

export function formatDuration(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes))
  const hours = Math.floor(safe / 60)
  const rest = safe % 60
  if (hours === 0) return `${rest}m`
  if (rest === 0) return `${hours}h`
  return `${hours}h ${rest}m`
}

export function formatTimer(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`
  return `${pad(minutes)}:${pad(seconds)}`
}

export function startOfWeek(date = new Date()): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  return copy
}

export function addDays(date: Date, amount: number): Date {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + amount)
  return copy
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isThisWeek(value: string | Date, now = new Date()): boolean {
  const date = typeof value === 'string' ? asDate(value) : value
  const start = startOfWeek(now)
  const end = addDays(start, 7)
  return date >= start && date < end
}

export function weekDates(now = new Date()): Date[] {
  const start = startOfWeek(now)
  return Array.from({ length: 7 }, (_, index) => addDays(start, index))
}

export function todayIndex(now = new Date()): number {
  return (now.getDay() + 6) % 7
}

export type Countdown = {
  overdue: boolean
  days: number
  hours: number
  minutes: number
  seconds: number
  diff: number
}

export function timeUntil(iso: string, now = new Date()): Countdown {
  const diff = new Date(iso).getTime() - now.getTime()
  const abs = Math.abs(diff)
  return {
    overdue: diff < 0,
    days: Math.floor(abs / 86_400_000),
    hours: Math.floor((abs % 86_400_000) / 3_600_000),
    minutes: Math.floor((abs % 3_600_000) / 60_000),
    seconds: Math.floor((abs % 60_000) / 1000),
    diff,
  }
}

export function formatCountdown(countdown: Countdown): string {
  const { days, hours, minutes, seconds } = countdown
  if (days > 0) return `${days}d ${pad(hours)}h ${pad(minutes)}m`
  if (hours > 0) return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`
  return `${minutes}m ${pad(seconds)}s`
}

export function compactCountdown(countdown: Countdown): string {
  if (countdown.days > 0) return `${countdown.days}d`
  if (countdown.hours > 0) return `${countdown.hours}h`
  if (countdown.minutes > 0) return `${countdown.minutes}m`
  return `${countdown.seconds}s`
}

export function dueLabel(iso: string, now = new Date()): string {
  const countdown = timeUntil(iso, now)
  if (countdown.overdue) return `Overdue by ${formatCountdown(countdown)}`
  if (countdown.diff < 3_600_000) return `Due in ${formatCountdown(countdown)}`
  return `Due in ${formatCountdown(countdown)}`
}

export function deadlineTone(iso: string, now = new Date()): 'overdue' | 'soon' | 'normal' {
  const countdown = timeUntil(iso, now)
  if (countdown.overdue) return 'overdue'
  if (countdown.diff < 24 * 3_600_000) return 'soon'
  return 'normal'
}

export function elapsedPercent(createdAt: string, dueAt: string, now = new Date()): number {
  const start = new Date(createdAt).getTime()
  const end = new Date(dueAt).getTime()
  if (end <= start) return 100
  return Math.min(100, Math.max(0, ((now.getTime() - start) / (end - start)) * 100))
}

export function greeting(now = new Date()): string {
  const hour = now.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function daysBetween(a: string | Date, b: string | Date): number {
  const first = typeof a === 'string' ? asDate(a) : a
  const second = typeof b === 'string' ? asDate(b) : b
  return Math.round((second.getTime() - first.getTime()) / 86_400_000)
}

export function streakFromDates(dates: string[], now = new Date()): number {
  const days = new Set(dates.map((date) => toDateInput(date)))
  let cursor = new Date(now)
  cursor.setHours(0, 0, 0, 0)
  if (!days.has(toDateInput(cursor))) cursor = addDays(cursor, -1)
  let streak = 0
  while (days.has(toDateInput(cursor))) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}
