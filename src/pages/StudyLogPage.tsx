import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import {
  CalendarCheck,
  Flame,
  Pause,
  Play,
  RotateCcw,
  Save,
  Timer as TimerIcon,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Field'
import { Segmented } from '../components/ui/Segmented'
import { EmptyState } from '../components/ui/EmptyState'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import {
  asDate,
  DAYS_SHORT,
  formatDate,
  formatDuration,
  formatTimer,
  isSameDay,
  streakFromDates,
  toDateInput,
  weekDates,
} from '../lib/date'

const PRESETS = [25, 50, 90] as const

const presetOptions = PRESETS.map((minutes) => ({
  value: String(minutes),
  label: `${minutes}m`,
}))

export function StudyLogPage() {
  const { sessions, addSession, deleteSession } = useData()
  const { notify } = useToast()

  const [preset, setPreset] = useState<number>(25)
  const [customMinutes, setCustomMinutes] = useState('25')
  const [remaining, setRemaining] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [started, setStarted] = useState(false)
  const [subject, setSubject] = useState('CS 402')
  const [topic, setTopic] = useState('')
  const completedRef = useRef(false)

  const [manual, setManual] = useState({
    subject: '',
    topic: '',
    minutes: '30',
    date: toDateInput(new Date()),
  })

  const totalSeconds = preset * 60
  const elapsed = totalSeconds - remaining
  const progress = totalSeconds > 0 ? 1 - remaining / totalSeconds : 0
  const radius = 54
  const circumference = 2 * Math.PI * radius

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      setRemaining((current) => (current <= 1 ? 0 : current - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [running])

  useEffect(() => {
    if (remaining !== 0 || !running) return
    setRunning(false)
    if (completedRef.current) return
    completedRef.current = true
    notify({
      title: 'Focus block complete',
      description: `${preset} minutes banked. Save the block to add it to your log.`,
      variant: 'success',
    })
  }, [remaining, running, preset, notify])

  const choosePreset = (value: string) => {
    if (running) return
    const minutes = Number(value)
    setPreset(minutes)
    setCustomMinutes(String(minutes))
    setRemaining(minutes * 60)
    setStarted(false)
    completedRef.current = false
  }

  const applyCustomDuration = (event: FormEvent) => {
    event.preventDefault()
    if (running) return
    const minutes = Math.round(Number(customMinutes))
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 720) {
      notify({
        title: 'Check the timer length',
        description: 'Use any whole number of minutes from 1 to 720.',
        variant: 'error',
      })
      return
    }
    setPreset(minutes)
    setRemaining(minutes * 60)
    setStarted(false)
    completedRef.current = false
  }

  const toggleTimer = () => {
    if (remaining === 0) {
      setRemaining(totalSeconds)
      completedRef.current = false
    }
    setStarted(true)
    setRunning((current) => !current)
  }

  const resetTimer = () => {
    setRunning(false)
    setRemaining(totalSeconds)
    setStarted(false)
    completedRef.current = false
  }

  const saveBlock = async () => {
    if (elapsed < 60) {
      notify({
        title: 'Not enough focus time',
        description: 'Run the timer for at least one minute before saving.',
        variant: 'info',
      })
      return
    }
    try {
      await addSession({
        subject: subject.trim() || 'General',
        topic: topic.trim() || 'Focus block',
        minutes: Math.max(1, Math.round(elapsed / 60)),
        date: toDateInput(new Date()),
      })
      notify({
        title: 'Focus block saved',
        description: `${formatDuration(Math.round(elapsed / 60))} added to your study log.`,
        variant: 'success',
      })
      setTopic('')
      resetTimer()
    } catch (cause) {
      notify({
        title: 'Could not save focus block',
        description: cause instanceof Error ? cause.message : 'Try again.',
        variant: 'error',
      })
    }
  }

  const submitManual = async (event: FormEvent) => {
    event.preventDefault()
    const minutes = Number(manual.minutes)
    if (!manual.subject.trim()) {
      notify({ title: 'Add a subject', description: 'Every session needs a subject.', variant: 'error' })
      return
    }
    if (!Number.isFinite(minutes) || minutes <= 0) {
      notify({ title: 'Check the duration', description: 'Enter a positive number of minutes.', variant: 'error' })
      return
    }
    try {
      await addSession({
        subject: manual.subject.trim(),
        topic: manual.topic.trim() || 'Study session',
        minutes: Math.round(minutes),
        date: manual.date,
      })
      notify({
        title: 'Session logged',
        description: `${formatDuration(Math.round(minutes))} · ${manual.subject.trim()}`,
        variant: 'success',
      })
      setManual({
        subject: '',
        topic: '',
        minutes: '30',
        date: toDateInput(new Date()),
      })
    } catch (cause) {
      notify({
        title: 'Could not log session',
        description: cause instanceof Error ? cause.message : 'Try again.',
        variant: 'error',
      })
    }
  }

  const totalMinutes = sessions.reduce((total, session) => total + session.minutes, 0)
  const today = new Date()
  const todayMinutes = sessions
    .filter((session) => isSameDay(asDate(session.date), today))
    .reduce((total, session) => total + session.minutes, 0)
  const streak = streakFromDates(sessions.map((session) => session.date))

  const week = weekDates()
  const daily = week.map((date) => ({
    date,
    minutes: sessions
      .filter((session) => isSameDay(asDate(session.date), date))
      .reduce((total, session) => total + session.minutes, 0),
  }))
  const maxMinutes = Math.max(30, ...daily.map((day) => day.minutes))
  const weekTotal = daily.reduce((total, day) => total + day.minutes, 0)

  const recent = [...sessions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)
  const quickSubjects = Array.from(new Set(sessions.map((session) => session.subject))).slice(0, 6)

  const status = running ? 'Focusing' : remaining === 0 ? 'Complete' : started ? 'Paused' : 'Ready'

  return (
    <>
      <PageHeader
        eyebrow="Deep work"
        title="Study log"
        description="Run a focus block, save it, and keep an honest record of the hours that move the term forward."
      />

      <section className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Study log stats">
        <StatCard label="Total tracked" value={formatDuration(totalMinutes)} icon={TimerIcon} hint={`${sessions.length} sessions`} />
        <StatCard label="Today" value={formatDuration(todayMinutes)} icon={CalendarCheck} accent="emerald" hint="logged so far" />
        <StatCard label="Streak" value={`${streak}d`} icon={Flame} accent="amber" hint="consecutive days" />
        <StatCard label="This week" value={formatDuration(weekTotal)} icon={TrendingUp} accent="violet" hint="Monday to today" />
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.05fr_0.95fr]" aria-label="Focus timer and weekly log">
        <div className="fade-up rounded-2xl border border-line bg-gradient-to-b from-surface to-surface-2 p-5 backdrop-blur-xl sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-accent/70">
                Focus timer
              </p>
              <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-ink">
                Protect the block
              </h2>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-medium ${
                running
                  ? 'border-accent/20 bg-accent/10 text-accent'
                  : remaining === 0
                    ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                    : 'border-line bg-surface text-muted'
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  running ? 'animate-pulse bg-accent' : remaining === 0 ? 'bg-emerald-400' : 'bg-faint'
                }`}
              />
              {status}
            </span>
          </div>

          <div className="mt-4 flex justify-center">
            <div className="relative grid size-52 place-items-center">
              <svg viewBox="0 0 128 128" className="absolute inset-0 size-full -rotate-90">
                <circle cx="64" cy="64" r={radius} fill="none" stroke="var(--line)" strokeWidth="6" />
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                  style={{
                    transition: 'stroke-dashoffset 0.6s linear',
                    filter: 'drop-shadow(0 0 8px rgb(var(--accent-rgb) / 0.55))',
                  }}
                />
              </svg>
              <div className="relative text-center">
                <p className="font-mono text-4xl font-medium tracking-tight text-ink tabular-nums">
                  {formatTimer(remaining)}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-faint">
                  {remaining === 0 ? 'block complete' : `${preset} minute block`}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <Segmented
              options={presetOptions}
              value={String(preset)}
              onChange={choosePreset}
              id="focus-preset"
            />
          </div>

          <form
            onSubmit={applyCustomDuration}
            className="mx-auto mt-3 flex max-w-xs items-end justify-center gap-2"
          >
            <Field label="Any length" htmlFor="focus-custom" hint="1–720 minutes" className="w-32">
              <Input
                id="focus-custom"
                type="number"
                min={1}
                max={720}
                value={customMinutes}
                onChange={(event) => setCustomMinutes(event.target.value)}
                disabled={running}
              />
            </Field>
            <Button type="submit" variant="secondary" disabled={running} icon={<TimerIcon size={14} />}>
              Set
            </Button>
          </form>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Subject" htmlFor="focus-subject">
              <Input
                id="focus-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="CS 402"
              />
            </Field>
            <Field label="Topic" htmlFor="focus-topic">
              <Input
                id="focus-topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="What are you working on?"
              />
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              variant={running ? 'secondary' : 'primary'}
              onClick={toggleTimer}
              icon={running ? <Pause size={15} /> : <Play size={15} />}
            >
              {running ? 'Pause' : remaining === 0 ? 'Restart' : started ? 'Resume' : 'Start focus'}
            </Button>
            <Button variant="ghost" onClick={resetTimer} icon={<RotateCcw size={14} />}>
              Reset
            </Button>
            <Button
              variant="subtle"
              onClick={saveBlock}
              disabled={elapsed < 60}
              icon={<Save size={14} />}
              className="ml-auto"
            >
              Save block
            </Button>
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-subtle">
            Saving logs the elapsed time against the subject above. Timer runs locally — no
            background sync required.
          </p>

          {quickSubjects.length > 0 && (
            <div className="mt-4 border-t border-line pt-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-subtle">
                Quick subjects
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {quickSubjects.map((entry) => (
                  <button
                    key={entry}
                    type="button"
                    onClick={() => setSubject(entry)}
                    className={`rounded-md border px-2 py-1 font-mono text-[10px] transition ${
                      subject === entry
                        ? 'border-accent/25 bg-accent/10 text-accent'
                        : 'border-line bg-surface-2 text-faint hover:border-line-strong hover:text-ink-soft'
                    }`}
                  >
                    {entry}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="fade-up rounded-2xl border border-line bg-gradient-to-b from-surface to-surface-2 p-5 backdrop-blur-xl sm:p-6" style={{ animationDelay: '80ms' }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-accent/70">
                  Rhythm
                </p>
                <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-ink">
                  This week
                </h2>
              </div>
              <span className="font-mono text-xs text-accent">{formatDuration(weekTotal)}</span>
            </div>

            <div className="mt-5 flex h-32 items-end gap-2">
              {daily.map((day) => {
                const height = Math.max(4, (day.minutes / maxMinutes) * 100)
                const isToday = isSameDay(day.date, today)
                return (
                  <div key={day.date.toISOString()} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        isToday
                          ? 'bg-gradient-to-t from-accent-strong/30 to-accent shadow-[0_0_14px_-2px_rgba(34,211,238,0.6)]'
                          : 'bg-gradient-to-t from-accent-strong/10 to-accent/50'
                      }`}
                      style={{ height: `${height}%` }}
                      title={`${formatDate(day.date)} · ${formatDuration(day.minutes)}`}
                      aria-label={`${formatDate(day.date)}: ${formatDuration(day.minutes)}`}
                    />
                  </div>
                )
              })}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-2 text-center">
              {DAYS_SHORT.map((label, index) => (
                <span
                  key={label}
                  className={`text-[10px] ${
                    isSameDay(week[index], today) ? 'font-medium text-accent' : 'text-subtle'
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <form
            onSubmit={submitManual}
            className="fade-up rounded-2xl border border-line bg-gradient-to-b from-surface to-surface-2 p-5 backdrop-blur-xl sm:p-6"
            style={{ animationDelay: '140ms' }}
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-accent/70">
              Manual entry
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-ink">
              Log a past session
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Subject" htmlFor="manual-subject">
                <Input
                  id="manual-subject"
                  value={manual.subject}
                  onChange={(event) => setManual((current) => ({ ...current, subject: event.target.value }))}
                  placeholder="THESIS"
                />
              </Field>
              <Field label="Minutes" htmlFor="manual-minutes">
                <Input
                  id="manual-minutes"
                  type="number"
                  min={1}
                  max={720}
                  value={manual.minutes}
                  onChange={(event) => setManual((current) => ({ ...current, minutes: event.target.value }))}
                />
              </Field>
              <Field label="Topic" htmlFor="manual-topic" className="sm:col-span-2">
                <Input
                  id="manual-topic"
                  value={manual.topic}
                  onChange={(event) => setManual((current) => ({ ...current, topic: event.target.value }))}
                  placeholder="Literature review"
                />
              </Field>
              <Field label="Date" htmlFor="manual-date">
                <Input
                  id="manual-date"
                  type="date"
                  value={manual.date}
                  onChange={(event) => setManual((current) => ({ ...current, date: event.target.value }))}
                />
              </Field>
              <div className="flex items-end">
                <Button type="submit" variant="secondary" className="w-full" icon={<Save size={14} />}>
                  Add session
                </Button>
              </div>
            </div>
          </form>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-gradient-to-b from-surface to-surface-2 p-5 backdrop-blur-xl sm:p-6" aria-labelledby="recent-sessions">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-accent/70">
              History
            </p>
            <h2 id="recent-sessions" className="mt-1 font-display text-lg font-semibold tracking-tight text-ink">
              Recent sessions
            </h2>
          </div>
          <span className="font-mono text-[10px] text-faint">{sessions.length} total</span>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            icon={TimerIcon}
            title="No sessions yet"
            description="Run the focus timer or add a manual entry to start building your study history."
            className="mt-5 border-line py-10"
          />
        ) : (
          <div className="mt-4 divide-y divide-line">
            {recent.map((session) => (
              <div key={session.id} className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="hidden w-16 shrink-0 font-mono text-[10px] text-faint sm:block">
                  {formatDate(session.date)}
                </span>
                <span className="rounded-md border border-accent/15 bg-accent/[0.07] px-1.5 py-0.5 font-mono text-[10px] text-accent">
                  {session.subject}
                </span>
                <p className="min-w-0 flex-1 truncate text-sm text-ink-soft">{session.topic}</p>
                <span className="font-mono text-[11px] text-muted tabular-nums">
                  {formatDuration(session.minutes)}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await deleteSession(session.id)
                      notify({ title: 'Session removed', description: session.topic, variant: 'info' })
                    } catch (cause) {
                      notify({
                        title: 'Could not remove session',
                        description: cause instanceof Error ? cause.message : 'Try again.',
                        variant: 'error',
                      })
                    }
                  }}
                  aria-label={`Delete ${session.topic}`}
                  className="grid size-7 shrink-0 place-items-center rounded-lg text-subtle transition hover:bg-rose-400/10 hover:text-rose-300"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
