import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import {
  AlarmClock,
  AlertTriangle,
  BookOpen,
  CalendarDays,
  Check,
  Download,
  FileSpreadsheet,
  GraduationCap,
  ListChecks,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'
import { Button } from '../components/ui/Button'
import { Field, Input, Select, Textarea } from '../components/ui/Field'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Segmented } from '../components/ui/Segmented'
import type { SegmentedOption } from '../components/ui/Segmented'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import {
  addDays,
  DAYS_LONG,
  DAYS_SHORT,
  formatCountdown,
  formatDate,
  formatDateTime,
  formatTimeString,
  fromDateTimeInput,
  timeUntil,
  todayIndex,
  toDateTimeInput,
  weekDates,
} from '../lib/date'
import {
  PRIORITIES,
  PRIORITY_DOT,
  PRIORITY_TONE,
  TONES,
  TONE_STYLES,
} from '../lib/tone'
import {
  parseTimetableFile,
  TIMETABLE_TEMPLATE,
} from '../lib/timetableImport'
import type { TimetableParseResult } from '../lib/timetableImport'
import type { Assignment, Lecture, Priority, Tone } from '../data/models'
import { cn } from '../lib/utils'

type Tab = 'timetable' | 'assignments'
type AssignmentFilter = 'All' | 'Open' | 'Done'

type LectureForm = {
  course: string
  title: string
  day: string
  startTime: string
  endTime: string
  location: string
  tone: Tone
}

type AssignmentForm = {
  title: string
  course: string
  description: string
  dueAt: string
  priority: Priority
}

type DeleteTarget =
  | { kind: 'lecture'; id: string; name: string }
  | { kind: 'assignment'; id: string; name: string }

type ImportMode = 'merge' | 'replace'

function downloadTextFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const blankLecture = (): LectureForm => ({
  course: '',
  title: '',
  day: '0',
  startTime: '09:00',
  endTime: '10:30',
  location: '',
  tone: 'cyan',
})

const blankAssignment = (): AssignmentForm => ({
  title: '',
  course: '',
  description: '',
  dueAt: toDateTimeInput(addDays(new Date(), 7)),
  priority: 'Medium',
})

function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

export function AcademicPage() {
  const {
    lectures,
    assignments,
    addLecture,
    updateLecture,
    deleteLecture,
    importLectures,
    addAssignment,
    updateAssignment,
    toggleAssignment,
    deleteAssignment,
  } = useData()
  const { notify } = useToast()
  const now = useNow()

  const [tab, setTab] = useState<Tab>('timetable')
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>('All')

  const [lectureModalOpen, setLectureModalOpen] = useState(false)
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null)
  const [lectureForm, setLectureForm] = useState<LectureForm>(blankLecture)
  const [lectureError, setLectureError] = useState('')

  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [assignmentForm, setAssignmentForm] = useState<AssignmentForm>(blankAssignment)
  const [assignmentError, setAssignmentError] = useState('')
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importMode, setImportMode] = useState<ImportMode>('merge')
  const [importFileName, setImportFileName] = useState('')
  const [importParsing, setImportParsing] = useState(false)
  const [importSaving, setImportSaving] = useState(false)
  const [importError, setImportError] = useState('')
  const [importResult, setImportResult] = useState<TimetableParseResult | null>(null)

  const week = weekDates(now)
  const today = todayIndex(now)
  const openAssignments = assignments.filter((assignment) => !assignment.completed)
  const completedAssignments = assignments.filter((assignment) => assignment.completed)
  const completionRate = assignments.length
    ? Math.round((completedAssignments.length / assignments.length) * 100)
    : 0
  const nextDeadline = [...openAssignments].sort(
    (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
  )[0]
  const nextCountdown = nextDeadline ? timeUntil(nextDeadline.dueAt, now) : null
  const nextValue = nextCountdown
    ? nextCountdown.overdue
      ? 'Overdue'
      : `${nextCountdown.days}d ${String(nextCountdown.hours).padStart(2, '0')}h`
    : 'Clear'

  const tabOptions: SegmentedOption<Tab>[] = [
    { value: 'timetable', label: 'Timetable', count: lectures.length },
    { value: 'assignments', label: 'Assignments', count: assignments.length },
  ]

  const filterOptions: SegmentedOption<AssignmentFilter>[] = [
    { value: 'All', label: 'All', count: assignments.length },
    { value: 'Open', label: 'Open', count: openAssignments.length },
    { value: 'Done', label: 'Done', count: completedAssignments.length },
  ]

  const importModeOptions: SegmentedOption<ImportMode>[] = [
    { value: 'merge', label: 'Add to timetable' },
    { value: 'replace', label: 'Replace timetable' },
  ]

  const visibleAssignments = useMemo(() => {
    return assignments
      .filter((assignment) => {
        if (assignmentFilter === 'Open') return !assignment.completed
        if (assignmentFilter === 'Done') return assignment.completed
        return true
      })
      .sort((a, b) => {
        if (assignmentFilter === 'Done') {
          return (
            new Date(b.completedAt ?? b.dueAt).getTime() -
            new Date(a.completedAt ?? a.dueAt).getTime()
          )
        }
        if (a.completed !== b.completed) return a.completed ? 1 : -1
        if (a.completed) {
          return (
            new Date(b.completedAt ?? b.dueAt).getTime() -
            new Date(a.completedAt ?? a.dueAt).getTime()
          )
        }
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
      })
  }, [assignments, assignmentFilter])

  const openLectureCreate = (day = 0) => {
    setEditingLecture(null)
    setLectureForm({ ...blankLecture(), day: String(day) })
    setLectureError('')
    setLectureModalOpen(true)
  }

  const openLectureEdit = (lecture: Lecture) => {
    setEditingLecture(lecture)
    setLectureForm({
      course: lecture.course,
      title: lecture.title,
      day: String(lecture.day),
      startTime: lecture.startTime,
      endTime: lecture.endTime,
      location: lecture.location,
      tone: lecture.tone,
    })
    setLectureError('')
    setLectureModalOpen(true)
  }

  const closeLectureModal = () => {
    setLectureModalOpen(false)
    setEditingLecture(null)
    setLectureError('')
  }

  const saveLecture = async () => {
    setLectureError('')
    const course = lectureForm.course.trim()
    const title = lectureForm.title.trim()
    if (!course || !title) {
      setLectureError('Add a course code and a lecture title.')
      return
    }
    if (lectureForm.startTime >= lectureForm.endTime) {
      setLectureError('The end time must be after the start time.')
      return
    }

    const input = {
      course,
      title,
      day: Number(lectureForm.day),
      startTime: lectureForm.startTime,
      endTime: lectureForm.endTime,
      location: lectureForm.location.trim(),
      tone: lectureForm.tone,
    }

    setSaving(true)
    try {
      if (editingLecture) {
        await updateLecture(editingLecture.id, input)
        notify({ title: 'Lecture updated', description: title, variant: 'success' })
      } else {
        await addLecture(input)
        notify({ title: 'Lecture added', description: title, variant: 'success' })
      }
      setTab('timetable')
      closeLectureModal()
    } catch (cause) {
      setLectureError(cause instanceof Error ? cause.message : 'Could not save the lecture.')
    } finally {
      setSaving(false)
    }
  }

  const submitLecture = (event: FormEvent) => {
    event.preventDefault()
    void saveLecture()
  }

  const openAssignmentCreate = () => {
    setEditingAssignment(null)
    setAssignmentForm(blankAssignment())
    setAssignmentError('')
    setAssignmentModalOpen(true)
  }

  const openAssignmentEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment)
    setAssignmentForm({
      title: assignment.title,
      course: assignment.course,
      description: assignment.description,
      dueAt: toDateTimeInput(assignment.dueAt),
      priority: assignment.priority,
    })
    setAssignmentError('')
    setAssignmentModalOpen(true)
  }

  const closeAssignmentModal = () => {
    setAssignmentModalOpen(false)
    setEditingAssignment(null)
    setAssignmentError('')
  }

  const saveAssignment = async () => {
    setAssignmentError('')
    const title = assignmentForm.title.trim()
    const course = assignmentForm.course.trim()
    const dueAt = fromDateTimeInput(assignmentForm.dueAt)

    if (!title) {
      setAssignmentError('Give the assignment a clear title.')
      return
    }
    if (!course) {
      setAssignmentError('Add the course this assignment belongs to.')
      return
    }
    if (!dueAt) {
      setAssignmentError('Choose a due date and time.')
      return
    }

    const input = {
      title,
      course,
      description: assignmentForm.description.trim(),
      dueAt,
      priority: assignmentForm.priority,
    }

    setSaving(true)
    try {
      if (editingAssignment) {
        await updateAssignment(editingAssignment.id, input)
        notify({ title: 'Assignment updated', description: title, variant: 'success' })
      } else {
        await addAssignment(input)
        setAssignmentFilter('All')
        notify({ title: 'Assignment added', description: title, variant: 'success' })
      }
      setTab('assignments')
      closeAssignmentModal()
    } catch (cause) {
      setAssignmentError(
        cause instanceof Error ? cause.message : 'Could not save the assignment.',
      )
    } finally {
      setSaving(false)
    }
  }

  const submitAssignment = (event: FormEvent) => {
    event.preventDefault()
    void saveAssignment()
  }

  const complete = async (assignment: Assignment) => {
    try {
      await toggleAssignment(assignment.id)
      if (!assignment.completed) {
        notify({ title: 'Assignment completed', description: assignment.title, variant: 'success' })
      }
    } catch (cause) {
      notify({
        title: 'Could not update assignment',
        description: cause instanceof Error ? cause.message : 'Try again.',
        variant: 'error',
      })
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      if (deleteTarget.kind === 'lecture') {
        await deleteLecture(deleteTarget.id)
        notify({ title: 'Lecture removed', description: deleteTarget.name, variant: 'info' })
      } else {
        await deleteAssignment(deleteTarget.id)
        notify({ title: 'Assignment removed', description: deleteTarget.name, variant: 'info' })
      }
      setDeleteTarget(null)
    } catch (cause) {
      notify({
        title: 'Could not delete item',
        description: cause instanceof Error ? cause.message : 'Try again.',
        variant: 'error',
      })
    }
  }

  const openImport = () => {
    setImportMode('merge')
    setImportFileName('')
    setImportParsing(false)
    setImportError('')
    setImportResult(null)
    setImportOpen(true)
  }

  const closeImport = () => {
    setImportOpen(false)
    setImportParsing(false)
    setImportSaving(false)
    setImportError('')
    setImportResult(null)
    setImportFileName('')
  }

  const downloadTemplate = () => {
    downloadTextFile(
      `\uFEFF${TIMETABLE_TEMPLATE}`,
      'ProTask-timetable-template.csv',
      'text/csv;charset=utf-8',
    )
    notify({ title: 'Template downloaded', description: 'Fill it in and import the CSV.', variant: 'info' })
  }

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setImportFileName(file.name)
    setImportParsing(true)
    setImportError('')
    setImportResult(null)

    try {
      const result = await parseTimetableFile(file)
      setImportResult(result)
      if (result.lectures.length === 0) {
        const detail = result.issues
          .slice(0, 2)
          .map((issue) => `Row ${issue.row}: ${issue.message}`)
          .join(' ')
        setImportError(
          `No classes were found${result.sheet ? ` on sheet “${result.sheet}”` : ''}. ${detail || 'Check the column names or use the template.'}`,
        )
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Could not read that file.')
    } finally {
      setImportParsing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const confirmImport = async () => {
    if (!importResult?.lectures.length) return
    setImportSaving(true)
    setImportError('')
    try {
      const { added, skipped } = await importLectures(importResult.lectures, importMode)
      setTab('timetable')
      closeImport()
      notify({
        title: importMode === 'replace' ? 'Timetable replaced' : 'Timetable imported',
        description: `${added} ${added === 1 ? 'class' : 'classes'} added${skipped ? `, ${skipped} duplicate${skipped === 1 ? '' : 's'} skipped` : ''}.`,
        variant: 'success',
      })
    } catch (cause) {
      setImportError(cause instanceof Error ? cause.message : 'Could not import the timetable.')
    } finally {
      setImportSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Coursework"
        title="Academic"
        description="Your weekly timetable and every deadline in one queue, with live countdowns so nothing slips."
        actions={
          <>
            <Button variant="secondary" onClick={() => openLectureCreate()} icon={<BookOpen size={14} />}>
              Add lecture
            </Button>
            <Button variant="primary" onClick={openAssignmentCreate} icon={<Plus size={15} strokeWidth={2.6} />}>
              Add assignment
            </Button>
          </>
        }
      />

      <section className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Academic stats">
        <StatCard label="Open work" value={openAssignments.length} icon={ListChecks} accent="amber" hint="assignments remaining" />
        <StatCard label="Next deadline" value={nextValue} icon={AlarmClock} accent="rose" hint={nextDeadline ? nextDeadline.title : 'queue is clear'} />
        <StatCard label="Classes / week" value={lectures.length} icon={GraduationCap} accent="violet" hint="on the timetable" />
        <StatCard label="Completion" value={`${completionRate}%`} icon={Check} accent="emerald" hint={`${completedAssignments.length} of ${assignments.length} done`} />
      </section>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented options={tabOptions} value={tab} onChange={setTab} id="academic-tab" />
        <span className="flex items-center gap-2 text-[11px] text-faint">
          <CalendarDays size={13} className="text-subtle" />
          Week of {formatDate(week[0])} – {formatDate(week[6])}
        </span>
      </div>

      {tab === 'timetable' ? (
        <section className="mt-4 rounded-2xl border border-line bg-gradient-to-b from-surface to-surface-2 p-4 backdrop-blur-xl sm:p-5" aria-labelledby="timetable-heading">
          <div className="flex items-end justify-between gap-3 px-1 pb-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-accent/70">
                Weekly grid
              </p>
              <h2 id="timetable-heading" className="mt-1 font-display text-lg font-semibold tracking-tight text-ink">
                Timetable
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-faint">{lectures.length} classes</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={openImport}
                icon={<Upload size={13} />}
              >
                Import
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {week.map((date, index) => {
              const dayLectures = lectures
                .filter((lecture) => lecture.day === index)
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
              const isToday = index === today
              return (
                <div
                  key={date.toISOString()}
                  className={cn(
                    'flex min-h-[9rem] flex-col rounded-xl border p-2.5',
                    isToday
                      ? 'border-accent/20 bg-accent/[0.045]'
                      : 'border-line bg-surface-2',
                  )}
                >
                  <div className="flex items-center justify-between px-0.5 pb-2">
                    <div>
                      <p className={cn('text-[10px] font-medium uppercase tracking-[0.14em]', isToday ? 'text-accent' : 'text-faint')}>
                        {DAYS_SHORT[index]}
                      </p>
                      <p className={cn('font-display text-sm font-semibold', isToday ? 'text-ink' : 'text-ink-soft')}>
                        {date.getDate()}
                      </p>
                    </div>
                    {isToday && (
                      <span className="rounded-md border border-accent/20 bg-accent/10 px-1.5 py-0.5 text-[9px] font-medium text-accent">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-1.5">
                    {dayLectures.length === 0 ? (
                      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-line px-2 py-4 text-center">
                        <span className="text-[10px] text-faint">No classes</span>
                      </div>
                    ) : (
                      dayLectures.map((lecture) => {
                        const tone = TONE_STYLES[lecture.tone]
                        return (
                          <div
                            key={lecture.id}
                            className={cn(
                              'group relative rounded-lg border border-line bg-panel/70 p-2 transition hover:border-line-strong',
                              tone.border,
                              'border-l-2',
                            )}
                          >
                            <p className="font-mono text-[9px] text-faint">
                              {formatTimeString(lecture.startTime)} – {formatTimeString(lecture.endTime)}
                            </p>
                            <p className="mt-0.5 text-[11px] font-medium leading-snug text-ink">
                              {lecture.title}
                            </p>
                            <div className="mt-1 flex items-center gap-1 text-[9px] text-faint">
                              <span className="font-mono text-accent/80">{lecture.course}</span>
                              {lecture.location && (
                                <>
                                  <span className="text-subtle">·</span>
                                  <MapPin size={8} />
                                  <span className="truncate">{lecture.location}</span>
                                </>
                              )}
                            </div>

                            <div className="absolute right-1 top-1 flex gap-0.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => openLectureEdit(lecture)}
                                aria-label={`Edit ${lecture.title}`}
                                className="grid size-5 place-items-center rounded bg-panel/90 text-faint transition hover:text-accent"
                              >
                                <Pencil size={10} />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({ kind: 'lecture', id: lecture.id, name: lecture.title })
                                }
                                aria-label={`Delete ${lecture.title}`}
                                className="grid size-5 place-items-center rounded bg-panel/90 text-faint transition hover:text-rose-300"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => openLectureCreate(index)}
                    aria-label={`Add class on ${DAYS_LONG[index]}`}
                    className="mt-2 flex items-center justify-center gap-1 rounded-lg border border-dashed border-line py-1.5 text-[9px] font-medium text-faint transition hover:border-accent/30 hover:bg-accent/[0.04] hover:text-accent"
                  >
                    <Plus size={9} />
                    Add class
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      ) : (
        <section className="mt-4" aria-labelledby="assignment-queue">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-accent/70">
                Deadline queue
              </p>
              <h2 id="assignment-queue" className="mt-1 font-display text-lg font-semibold tracking-tight text-ink">
                Assignments
              </h2>
            </div>
            <Segmented
              options={filterOptions}
              value={assignmentFilter}
              onChange={setAssignmentFilter}
              id="assignment-filter"
            />
          </div>

          {visibleAssignments.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title={assignments.length === 0 ? 'No assignments yet' : 'Nothing in this view'}
              description={
                assignments.length === 0
                  ? 'Add your first deadline with a course, priority and due time.'
                  : 'Switch the filter or add a new assignment to fill the queue.'
              }
              className="mt-4 py-12"
              action={
                <Button variant="primary" onClick={openAssignmentCreate} icon={<Plus size={15} />}>
                  Add assignment
                </Button>
              }
            />
          ) : (
            <div className="mt-4 divide-y divide-line rounded-2xl border border-line bg-gradient-to-b from-surface to-surface-2 px-4 backdrop-blur-xl sm:px-5">
              {visibleAssignments.map((assignment) => {
                const countdown = timeUntil(assignment.dueAt, now)
                const overdue = countdown.overdue && !assignment.completed
                const soon = !overdue && countdown.diff < 24 * 3_600_000 && !assignment.completed
                return (
                  <div key={assignment.id} className="group flex items-start gap-3 py-3.5">
                    <button
                      type="button"
                      onClick={() => complete(assignment)}
                      aria-label={
                        assignment.completed
                          ? `Reopen ${assignment.title}`
                          : `Mark ${assignment.title} complete`
                      }
                      className={cn(
                        'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition',
                        assignment.completed
                          ? 'border-emerald-400/50 bg-emerald-400/20 text-emerald-300'
                          : 'border-line-strong text-transparent hover:border-accent/70 hover:text-accent',
                      )}
                    >
                      <Check size={12} strokeWidth={3} />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={cn(
                            'text-sm font-medium',
                            assignment.completed ? 'text-faint line-through' : 'text-ink',
                          )}
                        >
                          {assignment.title}
                        </p>
                        <Badge tone={PRIORITY_TONE[assignment.priority]}>
                          <span className={`size-1 rounded-full ${PRIORITY_DOT[assignment.priority]}`} />
                          {assignment.priority}
                        </Badge>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-faint">
                        <span className="font-mono text-[10px] tracking-wide text-accent/80">
                          {assignment.course}
                        </span>
                        <span className="size-0.5 rounded-full bg-subtle" />
                        <span>{formatDateTime(assignment.dueAt)}</span>
                        {assignment.completed ? (
                          <>
                            <span className="size-0.5 rounded-full bg-subtle" />
                            <span className="text-emerald-400/80">
                              Completed {assignment.completedAt ? formatDate(assignment.completedAt) : ''}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="size-0.5 rounded-full bg-subtle" />
                            <span
                              className={cn(
                                'font-mono text-[10px]',
                                overdue ? 'text-rose-300' : soon ? 'text-amber-300' : 'text-muted',
                              )}
                            >
                              {overdue ? 'Overdue by ' : 'Due in '}
                              {formatCountdown(countdown)}
                            </span>
                          </>
                        )}
                      </div>

                      {assignment.description && (
                        <p className="mt-1 line-clamp-1 text-[11px] text-subtle">
                          {assignment.description}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openAssignmentEdit(assignment)}
                        aria-label={`Edit ${assignment.title}`}
                      >
                        <Pencil size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setDeleteTarget({
                            kind: 'assignment',
                            id: assignment.id,
                            name: assignment.title,
                          })
                        }
                        aria-label={`Delete ${assignment.title}`}
                        className="hover:bg-rose-400/10 hover:text-rose-300"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      <Modal
        open={lectureModalOpen}
        onClose={closeLectureModal}
        title={editingLecture ? 'Edit lecture' : 'Add lecture'}
        description="Lectures repeat weekly on the timetable."
        footer={
          <>
            <Button variant="ghost" onClick={closeLectureModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={saveLecture}
              loading={saving}
              icon={editingLecture ? <Pencil size={14} /> : <Plus size={15} />}
            >
              {editingLecture ? 'Save lecture' : 'Add lecture'}
            </Button>
          </>
        }
      >
        <form id="lecture-form" onSubmit={submitLecture} className="space-y-4">
          {lectureError && (
            <div className="rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-3 py-2.5 text-xs text-rose-200">
              {lectureError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Course code" htmlFor="lecture-course">
              <Input
                id="lecture-course"
                value={lectureForm.course}
                onChange={(event) => setLectureForm((current) => ({ ...current, course: event.target.value }))}
                placeholder="CS 402"
              />
            </Field>
            <Field label="Day" htmlFor="lecture-day">
              <Select
                id="lecture-day"
                value={lectureForm.day}
                onChange={(day) => setLectureForm((current) => ({ ...current, day }))}
                options={DAYS_LONG.map((day, index) => ({ value: String(index), label: day }))}
              />
            </Field>
          </div>

          <Field label="Lecture title" htmlFor="lecture-title">
            <Input
              id="lecture-title"
              value={lectureForm.title}
              onChange={(event) => setLectureForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Machine Learning"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Starts" htmlFor="lecture-start">
              <Input
                id="lecture-start"
                type="time"
                value={lectureForm.startTime}
                onChange={(event) => setLectureForm((current) => ({ ...current, startTime: event.target.value }))}
              />
            </Field>
            <Field label="Ends" htmlFor="lecture-end">
              <Input
                id="lecture-end"
                type="time"
                value={lectureForm.endTime}
                onChange={(event) => setLectureForm((current) => ({ ...current, endTime: event.target.value }))}
              />
            </Field>
            <Field label="Location" htmlFor="lecture-location">
              <Input
                id="lecture-location"
                value={lectureForm.location}
                onChange={(event) => setLectureForm((current) => ({ ...current, location: event.target.value }))}
                placeholder="Room B204"
              />
            </Field>
          </div>

          <Field label="Accent" htmlFor="lecture-tone">
            <div id="lecture-tone" className="flex items-center gap-2 pt-1">
              {TONES.map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => setLectureForm((current) => ({ ...current, tone }))}
                  aria-label={`Use ${tone} accent`}
                  aria-pressed={lectureForm.tone === tone}
                  className={cn(
                    'grid size-8 place-items-center rounded-lg border transition',
                    lectureForm.tone === tone
                      ? 'border-line-strong bg-surface-3'
                      : 'border-line bg-surface-2 hover:border-line-strong',
                  )}
                >
                  <span className={`size-3 rounded-full ${TONE_STYLES[tone].dot}`} />
                </button>
              ))}
            </div>
          </Field>
        </form>
      </Modal>

      <Modal
        open={assignmentModalOpen}
        onClose={closeAssignmentModal}
        title={editingAssignment ? 'Edit assignment' : 'Add assignment'}
        description="Deadlines appear in the overview queue and sidebar badge automatically."
        footer={
          <>
            <Button variant="ghost" onClick={closeAssignmentModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={saveAssignment}
              loading={saving}
              icon={editingAssignment ? <Pencil size={14} /> : <Plus size={15} />}
            >
              {editingAssignment ? 'Save assignment' : 'Add assignment'}
            </Button>
          </>
        }
      >
        <form id="assignment-form" onSubmit={submitAssignment} className="space-y-4">
          {assignmentError && (
            <div className="rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-3 py-2.5 text-xs text-rose-200">
              {assignmentError}
            </div>
          )}

          <Field label="Title" htmlFor="assignment-title">
            <Input
              id="assignment-title"
              value={assignmentForm.title}
              onChange={(event) => setAssignmentForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Finish ML assignment 3"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Course" htmlFor="assignment-course">
              <Input
                id="assignment-course"
                value={assignmentForm.course}
                onChange={(event) => setAssignmentForm((current) => ({ ...current, course: event.target.value }))}
                placeholder="CS 402"
              />
            </Field>
            <Field label="Priority" htmlFor="assignment-priority">
              <Select
                id="assignment-priority"
                value={assignmentForm.priority}
                onChange={(priority) =>
                  setAssignmentForm((current) => ({ ...current, priority }))
                }
                options={PRIORITIES.map((priority) => ({ value: priority, label: priority }))}
              />
            </Field>
          </div>

          <Field label="Due date" htmlFor="assignment-due">
            <Input
              id="assignment-due"
              type="datetime-local"
              value={assignmentForm.dueAt}
              onChange={(event) => setAssignmentForm((current) => ({ ...current, dueAt: event.target.value }))}
            />
          </Field>

          <Field label="Notes" htmlFor="assignment-description">
            <Textarea
              id="assignment-description"
              value={assignmentForm.description}
              onChange={(event) =>
                setAssignmentForm((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="What needs to be done?"
            />
          </Field>
        </form>
      </Modal>

      <Modal
        open={importOpen}
        onClose={closeImport}
        title="Import timetable"
        description="Upload an Excel or CSV export and turn it into your weekly grid."
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={closeImport}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmImport}
              loading={importSaving}
              disabled={!importResult?.lectures.length || importParsing}
              icon={<Upload size={14} />}
            >
              {importMode === 'replace' ? 'Replace timetable' : 'Import classes'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-surface-2 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
                  <FileSpreadsheet size={16} />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">Excel or CSV</p>
                  <p className="mt-1 max-w-md text-[11px] leading-relaxed text-faint">
                    Use columns for Day, Course, Title, Start, End and Location. Weekday-column
                    grid exports also work.
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={downloadTemplate}
                icon={<Download size={13} />}
              >
                Template
              </Button>
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                variant="primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={importParsing}
                icon={importParsing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              >
                {importParsing ? 'Reading file…' : 'Choose file'}
              </Button>
              <span className="truncate text-[11px] text-faint">
                {importFileName || 'No file selected'}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.csv"
                onChange={handleImportFile}
                className="sr-only"
                aria-label="Choose timetable file"
              />
            </div>
          </div>

          {importError && (
            <div className="rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-3 py-2.5 text-xs text-rose-200">
              {importError}
            </div>
          )}

          {importResult && importResult.lectures.length > 0 && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-ink">
                    {importResult.lectures.length} classes ready to import
                  </p>
                  <p className="mt-0.5 text-[10px] text-faint">
                    Detected as a {importResult.format === 'grid' ? 'weekly grid' : 'table'}
                    {importResult.sheet ? ` on sheet “${importResult.sheet}”` : ''}.
                  </p>
                </div>
                <Segmented
                  options={importModeOptions}
                  value={importMode}
                  onChange={setImportMode}
                  id="import-mode"
                />
              </div>

              {importResult.issues.length > 0 && (
                <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2.5">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-amber-200">
                    <AlertTriangle size={12} />
                    {importResult.issues.length} row{importResult.issues.length === 1 ? '' : 's'} skipped
                  </p>
                  <ul className="mt-1.5 space-y-1 text-[10px] text-amber-100/70">
                    {importResult.issues.slice(0, 4).map((issue) => (
                      <li key={`${issue.row}-${issue.message}`}>
                        Row {issue.row}: {issue.message}
                      </li>
                    ))}
                  </ul>
                  {importResult.issues.length > 4 && (
                    <p className="mt-1 text-[10px] text-amber-100/60">
                      +{importResult.issues.length - 4} more
                    </p>
                  )}
                </div>
              )}

              {importMode === 'replace' && (
                <p className="rounded-xl border border-rose-400/15 bg-rose-400/[0.04] px-3 py-2.5 text-[11px] leading-relaxed text-rose-200/80">
                  Replacing removes the {lectures.length} classes currently on your timetable.
                </p>
              )}

              <div className="overflow-x-auto rounded-xl border border-line">
                <table className="w-full min-w-[34rem] text-left text-[11px]">
                  <thead className="bg-surface-2 text-[9px] uppercase tracking-[0.14em] text-faint">
                    <tr>
                      <th className="px-3 py-2 font-medium">Day</th>
                      <th className="px-3 py-2 font-medium">Time</th>
                      <th className="px-3 py-2 font-medium">Class</th>
                      <th className="px-3 py-2 font-medium">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {importResult.lectures.slice(0, 8).map((lecture, index) => (
                      <tr key={`${lecture.day}-${lecture.startTime}-${lecture.course}-${index}`}>
                        <td className="px-3 py-2 text-muted">{DAYS_SHORT[lecture.day]}</td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px] text-faint">
                          {formatTimeString(lecture.startTime)} – {formatTimeString(lecture.endTime)}
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-mono text-[10px] text-accent/80">{lecture.course}</span>
                          <p className="text-ink">{lecture.title}</p>
                        </td>
                        <td className="px-3 py-2 text-faint">{lecture.location || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {importResult.lectures.length > 8 && (
                <p className="text-[10px] text-faint">
                  Showing the first 8 of {importResult.lectures.length} classes.
                </p>
              )}
            </>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget?.kind === 'lecture' ? 'Delete lecture?' : 'Delete assignment?'}
        description={`This permanently removes "${deleteTarget?.name ?? ''}" from your workspace.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  )
}
