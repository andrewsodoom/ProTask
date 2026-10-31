import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  CalendarDays,
  Clock3,
  FolderKanban,
  Gauge,
  PackageCheck,
  Pencil,
  Plus,
  Search,
  Trash2,
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
  compactCountdown,
  deadlineTone,
  formatDate,
  formatDateRange,
  fromDateTimeInput,
  timeUntil,
  toDateInput,
  toDateTimeInput,
} from '../lib/date'
import {
  PROJECT_STATUSES,
  STATUS_TONE,
  TONES,
  TONE_STYLES,
} from '../lib/tone'
import type { Project, ProjectInput, ProjectStatus, Tone } from '../data/models'
import { cn } from '../lib/utils'

type Filter = 'All' | ProjectStatus

type ProjectForm = {
  name: string
  description: string
  stack: string
  status: ProjectStatus
  progress: string
  startDate: string
  dueAt: string
  estimatedHours: string
  tone: Tone
}

const blankForm = (): ProjectForm => ({
  name: '',
  description: '',
  stack: '',
  status: 'Planning',
  progress: '0',
  startDate: toDateInput(new Date()),
  dueAt: toDateTimeInput(addDays(new Date(), 14)),
  estimatedHours: '10',
  tone: 'cyan',
})

export function ProjectsPage() {
  const { projects, addProject, updateProject, deleteProject } = useData()
  const { notify } = useToast()

  const [filter, setFilter] = useState<Filter>('All')
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [form, setForm] = useState<ProjectForm>(blankForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)

  const active = projects.filter((project) => project.status !== 'Shipped')
  const shipped = projects.filter((project) => project.status === 'Shipped')
  const avgProgress = projects.length
    ? Math.round(projects.reduce((total, project) => total + project.progress, 0) / projects.length)
    : 0
  const totalHours = projects.reduce((total, project) => total + project.estimatedHours, 0)

  const filterOptions: SegmentedOption<Filter>[] = [
    { value: 'All', label: 'All', count: projects.length },
    ...PROJECT_STATUSES.map((status) => ({
      value: status,
      label: status,
      count: projects.filter((project) => project.status === status).length,
    })),
  ]

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return projects
      .filter((project) => {
        const matchesFilter = filter === 'All' || project.status === filter
        const matchesQuery =
          !needle ||
          project.name.toLowerCase().includes(needle) ||
          project.stack.join(' ').toLowerCase().includes(needle)
        return matchesFilter && matchesQuery
      })
      .sort((a, b) => {
        if (a.status === 'Shipped' && b.status !== 'Shipped') return 1
        if (b.status === 'Shipped' && a.status !== 'Shipped') return -1
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
      })
  }, [projects, filter, query])

  const openCreate = () => {
    setEditing(null)
    setForm(blankForm())
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (project: Project) => {
    setEditing(project)
    setForm({
      name: project.name,
      description: project.description,
      stack: project.stack.join(', '),
      status: project.status,
      progress: String(project.progress),
      startDate: project.startDate,
      dueAt: toDateTimeInput(project.dueAt),
      estimatedHours: String(project.estimatedHours),
      tone: project.tone,
    })
    setFormError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setFormError('')
  }

  const saveProject = async () => {
    setFormError('')

    const name = form.name.trim()
    const dueAt = fromDateTimeInput(form.dueAt)
    const progress = Number(form.progress)
    const estimatedHours = Number(form.estimatedHours)

    if (name.length < 2) {
      setFormError('Give the project a name of at least two characters.')
      return
    }
    if (!form.startDate || !dueAt) {
      setFormError('Add a start date and a due date.')
      return
    }
    if (new Date(dueAt).getTime() < new Date(`${form.startDate}T00:00:00`).getTime()) {
      setFormError('The due date must come after the start date.')
      return
    }
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      setFormError('Progress must be between 0 and 100.')
      return
    }
    if (!Number.isFinite(estimatedHours) || estimatedHours < 0) {
      setFormError('Estimated hours must be zero or more.')
      return
    }

    const input: ProjectInput = {
      name,
      description: form.description.trim(),
      stack: form.stack
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean),
      status: form.status,
      progress: Math.round(progress),
      startDate: form.startDate,
      dueAt,
      estimatedHours: Math.round(estimatedHours),
      tone: form.tone,
    }

    setSaving(true)
    try {
      if (editing) {
        await updateProject(editing.id, input)
        notify({ title: 'Project updated', description: name, variant: 'success' })
      } else {
        await addProject(input)
        setFilter('All')
        setQuery('')
        notify({ title: 'Project created', description: name, variant: 'success' })
      }
      closeModal()
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Could not save the project.')
    } finally {
      setSaving(false)
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    void saveProject()
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteProject(deleteTarget.id)
      notify({ title: 'Project deleted', description: deleteTarget.name, variant: 'info' })
      setDeleteTarget(null)
    } catch (cause) {
      notify({
        title: 'Could not delete project',
        description: cause instanceof Error ? cause.message : 'Try again.',
        variant: 'error',
      })
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Builds"
        title="Projects"
        description="Every side build with a real start date, deadline, stack and progress signal. Keep the portfolio honest."
        actions={
          <Button variant="primary" onClick={openCreate} icon={<Plus size={15} strokeWidth={2.6} />}>
            New project
          </Button>
        }
      />

      <section className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Project stats">
        <StatCard label="Active" value={active.length} icon={FolderKanban} hint="in flight" />
        <StatCard label="Shipped" value={shipped.length} icon={PackageCheck} accent="emerald" hint="completed builds" />
        <StatCard label="Avg progress" value={`${avgProgress}%`} icon={Gauge} accent="violet" hint="across all projects" />
        <StatCard label="Estimated" value={`${totalHours}h`} icon={Clock3} accent="amber" hint="total scope" />
      </section>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented options={filterOptions} value={filter} onChange={setFilter} id="project-filter" />
        <div className="relative w-full sm:max-w-xs">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects or stack"
            className="pl-9"
            aria-label="Search projects"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={projects.length === 0 ? 'No projects yet' : 'No matching projects'}
          description={
            projects.length === 0
              ? 'Create your first build with a deadline, stack and estimated hours.'
              : 'Try a different status filter or search term.'
          }
          className="mt-5 py-14"
          action={
            projects.length === 0 ? (
              <Button variant="primary" onClick={openCreate} icon={<Plus size={15} />}>
                Create a project
              </Button>
            ) : undefined
          }
        />
      ) : (
        <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Project list">
          {visible.map((project, index) => {
            const tone = TONE_STYLES[project.tone]
            const countdown = timeUntil(project.dueAt)
            const urgency = deadlineTone(project.dueAt)
            const dueText =
              project.status === 'Shipped'
                ? `Shipped ${formatDate(project.dueAt)}`
                : countdown.overdue
                  ? `Overdue by ${compactCountdown(countdown)}`
                  : countdown.days === 0
                    ? 'Due today'
                    : `${countdown.days}d left`
            return (
              <article
                key={project.id}
                className="fade-up group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-surface to-surface-2 p-5 backdrop-blur-xl transition duration-300 hover:border-line-strong"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <span className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${tone.bar} opacity-50`} />

                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`grid size-9 shrink-0 place-items-center rounded-xl border ${tone.icon}`}>
                      <FolderKanban size={16} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-base font-semibold tracking-tight text-ink">
                        {project.name}
                      </h2>
                      <p className="mt-0.5 text-[10px] text-faint">
                        {project.stack.length ? project.stack.join(' · ') : 'No stack yet'}
                      </p>
                    </div>
                  </div>
                  <Badge tone={STATUS_TONE[project.status]}>{project.status}</Badge>
                </div>

                <p className="mt-3 line-clamp-2 min-h-8 text-xs leading-relaxed text-muted">
                  {project.description || 'No description yet.'}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {project.stack.slice(0, 4).map((tech) => (
                    <span
                      key={tech}
                      className="rounded-md border border-line bg-surface px-1.5 py-0.5 text-[10px] text-muted"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.stack.length > 4 && (
                    <span className="rounded-md border border-line bg-surface px-1.5 py-0.5 text-[10px] text-faint">
                      +{project.stack.length - 4}
                    </span>
                  )}
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-[10px] text-faint">
                    <span>Progress</span>
                    <span className="font-mono text-ink-soft">{project.progress}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${tone.bar} ${tone.glow}`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-faint">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={11} />
                    {formatDateRange(project.startDate, project.dueAt)}
                  </span>
                  <span className="flex items-center justify-end gap-1.5">
                    <Clock3 size={11} />
                    {project.estimatedHours}h estimated
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                  <span
                    className={cn(
                      'text-[10px]',
                      urgency === 'overdue' && project.status !== 'Shipped'
                        ? 'text-rose-300'
                        : urgency === 'soon' && project.status !== 'Shipped'
                          ? 'text-amber-300'
                          : 'text-faint',
                    )}
                  >
                    {dueText}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(project)}
                      aria-label={`Edit ${project.name}`}
                    >
                      <Pencil size={13} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(project)}
                      aria-label={`Delete ${project.name}`}
                      className="hover:bg-rose-400/10 hover:text-rose-300"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit project' : 'New project'}
        description="Give the build a real timeline so the dashboard can track it honestly."
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={saveProject}
              loading={saving}
              icon={editing ? <Pencil size={14} /> : <Plus size={15} />}
            >
              {editing ? 'Save changes' : 'Create project'}
            </Button>
          </>
        }
      >
        <form id="project-form" onSubmit={submit} className="space-y-4">
          {formError && (
            <div className="rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-3 py-2.5 text-xs text-rose-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Project name" htmlFor="project-name">
              <Input
                id="project-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="CampusRoute"
              />
            </Field>
            <Field label="Status" htmlFor="project-status">
              <Select
                id="project-status"
                value={form.status}
                onChange={(status) => setForm((current) => ({ ...current, status }))}
                options={PROJECT_STATUSES.map((status) => ({ value: status, label: status }))}
              />
            </Field>
          </div>

          <Field label="Description" htmlFor="project-description">
            <Textarea
              id="project-description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="What are you building and why?"
            />
          </Field>

          <Field label="Stack" htmlFor="project-stack" hint="Comma separated">
            <Input
              id="project-stack"
              value={form.stack}
              onChange={(event) => setForm((current) => ({ ...current, stack: event.target.value }))}
              placeholder="React, Tailwind, Supabase"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Start date" htmlFor="project-start">
              <Input
                id="project-start"
                type="date"
                value={form.startDate}
                onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
              />
            </Field>
            <Field label="Due date" htmlFor="project-due">
              <Input
                id="project-due"
                type="datetime-local"
                value={form.dueAt}
                onChange={(event) => setForm((current) => ({ ...current, dueAt: event.target.value }))}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Estimated hours" htmlFor="project-hours">
              <Input
                id="project-hours"
                type="number"
                min={0}
                max={2000}
                value={form.estimatedHours}
                onChange={(event) =>
                  setForm((current) => ({ ...current, estimatedHours: event.target.value }))
                }
              />
            </Field>
            <Field label="Accent" htmlFor="project-tone">
              <div id="project-tone" className="flex items-center gap-2 pt-1">
                {TONES.map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, tone }))}
                    aria-label={`Use ${tone} accent`}
                    aria-pressed={form.tone === tone}
                    className={cn(
                      'grid size-8 place-items-center rounded-lg border transition',
                      form.tone === tone
                        ? 'border-line-strong bg-surface-3'
                        : 'border-line bg-surface-2 hover:border-line-strong',
                    )}
                  >
                    <span className={`size-3 rounded-full ${TONE_STYLES[tone].dot}`} />
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <Field label="Progress" htmlFor="project-progress">
            <div className="flex items-center gap-3">
              <input
                id="project-progress"
                type="range"
                min={0}
                max={100}
                value={form.progress}
                onChange={(event) =>
                  setForm((current) => ({ ...current, progress: event.target.value }))
                }
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-surface-3 accent-accent"
              />
              <span className="w-10 text-right font-mono text-xs text-accent">
                {form.progress}%
              </span>
            </div>
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete project?"
        description={`This permanently removes "${deleteTarget?.name ?? ''}" and its timeline from this workspace.`}
        confirmLabel="Delete project"
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  )
}
