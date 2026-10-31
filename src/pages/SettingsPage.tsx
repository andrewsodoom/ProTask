import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Download,
  FileJson,
  FileSpreadsheet,
  HardDrive,
  LogOut,
  Palette,
  RefreshCw,
  ShieldCheck,
  User,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Field'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { SoundToggle } from '../components/ui/SoundToggle'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useAuth, userInitials } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { formatDate, formatDuration, toDateInput } from '../lib/date'

function downloadFile(content: string, filename: string, type: string) {
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

export function SettingsPage() {
  const { user, updateName, signOut } = useAuth()
  const { projects, assignments, lectures, sessions, resetData } = useData()
  const { notify } = useToast()

  const [name, setName] = useState(user?.name ?? '')
  const [profileError, setProfileError] = useState('')
  const [resetOpen, setResetOpen] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    setName(user?.name ?? '')
  }, [user?.name])

  const totalMinutes = sessions.reduce((total, session) => total + session.minutes, 0)
  const storageSize = new Blob([
    JSON.stringify({ projects, assignments, lectures, sessions }),
  ]).size
  const storageLabel =
    storageSize > 1024 * 1024
      ? `${(storageSize / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.max(1, Math.round(storageSize / 1024))} KB`

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault()
    setProfileError('')
    setSavingProfile(true)
    const result = await updateName(name)
    setSavingProfile(false)
    if (result.ok) {
      notify({ title: 'Profile updated', description: 'Your display name has been saved.', variant: 'success' })
    } else {
      setProfileError(result.error)
    }
  }

  const exportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      user: user ? { name: user.name, email: user.email } : null,
      projects,
      assignments,
      lectures,
      sessions,
    }
    downloadFile(
      JSON.stringify(payload, null, 2),
      `ProTask-${toDateInput(new Date())}.json`,
      'application/json',
    )
    notify({ title: 'Workspace exported', description: 'JSON backup downloaded.', variant: 'success' })
  }

  const exportCsv = () => {
    const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`
    const rows = [
      ['Date', 'Subject', 'Topic', 'Minutes'],
      ...[...sessions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((session) => [session.date, session.subject, session.topic, session.minutes]),
    ]
    const csv = `\uFEFF${rows.map((row) => row.map(escape).join(',')).join('\n')}`
    downloadFile(csv, `ProTask-sessions-${toDateInput(new Date())}.csv`, 'text/csv;charset=utf-8')
    notify({ title: 'Sessions exported', description: 'CSV downloaded.', variant: 'success' })
  }

  const confirmReset = async () => {
    setClearing(true)
    try {
      await resetData()
      setResetOpen(false)
      notify({
        title: 'Workspace cleared',
        description: 'All projects, deadlines, lectures and sessions were removed.',
        variant: 'info',
      })
    } catch (cause) {
      notify({
        title: 'Could not clear workspace',
        description: cause instanceof Error ? cause.message : 'Try again.',
        variant: 'error',
      })
    } finally {
      setClearing(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your synced workspace, profile and data exports. Your data is stored in your account."
      />

      <section
        className="fade-up mt-7 flex flex-col gap-4 rounded-2xl border border-line bg-gradient-to-b from-surface to-surface-2 p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-6"
        aria-labelledby="appearance-heading"
      >
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
            <Palette size={16} />
          </span>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-accent/70">
              Appearance
            </p>
            <h2 id="appearance-heading" className="mt-1 font-display text-lg font-semibold tracking-tight text-ink">
              Choose your theme
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-faint">
              Switch between the dark neon workspace and a bright daylight view. Your theme and button sound preference are remembered on this device.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SoundToggle />
          <ThemeToggle withLabel />
        </div>
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="fade-up rounded-2xl border border-line bg-gradient-to-b from-surface to-surface-2 p-5 backdrop-blur-xl sm:p-6" aria-labelledby="profile-heading">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-accent/70">
                Profile
              </p>
              <h2 id="profile-heading" className="mt-1 font-display text-lg font-semibold tracking-tight text-ink">
                Your account
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
              <ShieldCheck size={11} />
              Cloud sync
            </span>
          </div>

          <div className="mt-5 flex items-center gap-4 rounded-xl border border-line bg-surface-2 p-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent/80 to-indigo-500/80 font-display text-sm font-semibold text-accent-contrast ring-2 ring-accent/20">
              {user ? userInitials(user.name) : 'PT'}
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-base font-semibold text-ink">
                {user?.name ?? 'ProTask'}
              </p>
              <p className="truncate text-xs text-faint">{user?.email ?? ''}</p>
              <p className="mt-0.5 text-[10px] text-subtle">
                Member since {user ? formatDate(user.createdAt, true) : '—'}
              </p>
            </div>
          </div>

          <form onSubmit={saveProfile} className="mt-5 space-y-4">
            {profileError && (
              <div className="rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-3 py-2.5 text-xs text-rose-200">
                {profileError}
              </div>
            )}
            <Field label="Display name" htmlFor="settings-name" hint="Shown in the sidebar and greeting.">
              <div className="relative">
                <User size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                <Input
                  id="settings-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="pl-9"
                  placeholder="Your name"
                />
              </div>
            </Field>
            <Field label="Email" htmlFor="settings-email" hint="Email is the account key and cannot be changed here.">
              <Input id="settings-email" value={user?.email ?? ''} readOnly className="text-faint" />
            </Field>
            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-[10px] leading-relaxed text-subtle">
                Passwords are managed securely by Supabase Auth.
              </p>
              <Button type="submit" variant="primary" loading={savingProfile}>
                Save profile
              </Button>
            </div>
          </form>
        </section>

        <section className="fade-up rounded-2xl border border-line bg-gradient-to-b from-surface to-surface-2 p-5 backdrop-blur-xl sm:p-6" style={{ animationDelay: '80ms' }} aria-labelledby="workspace-heading">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-accent/70">
            Workspace
          </p>
          <h2 id="workspace-heading" className="mt-1 font-display text-lg font-semibold tracking-tight text-ink">
            Workspace snapshot
          </h2>

          <div className="mt-5 space-y-2.5">
            {[
              { label: 'Projects', value: projects.length },
              { label: 'Assignments', value: assignments.length },
              { label: 'Lectures / week', value: lectures.length },
              { label: 'Study sessions', value: sessions.length },
              { label: 'Focus time', value: formatDuration(totalMinutes) },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-lg border border-line bg-surface-2 px-3 py-2">
                <span className="text-xs text-muted">{row.label}</span>
                <span className="font-mono text-xs text-ink tabular-nums">{row.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-accent/15 bg-accent/[0.05] px-3.5 py-3">
            <span className="flex items-center gap-2 text-[11px] text-muted">
              <HardDrive size={14} className="text-accent" />
              Workspace payload
            </span>
            <span className="font-mono text-xs text-accent">{storageLabel}</span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button variant="secondary" onClick={exportJson} icon={<FileJson size={14} />}>
              Export JSON
            </Button>
            <Button variant="secondary" onClick={exportCsv} icon={<FileSpreadsheet size={14} />}>
              Export sessions CSV
            </Button>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[10px] text-subtle">
            <Download size={10} />
            Exports include everything stored for this account.
          </p>
        </section>
      </div>

      <section className="fade-up mt-4 rounded-2xl border border-rose-400/15 bg-gradient-to-b from-rose-400/[0.04] to-transparent p-5 backdrop-blur-xl sm:p-6" style={{ animationDelay: '160ms' }} aria-labelledby="danger-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-rose-300/70">
              Danger zone
            </p>
            <h2 id="danger-heading" className="mt-1 font-display text-lg font-semibold tracking-tight text-ink">
              Clear or leave
            </h2>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-faint">
              Clearing removes every project, deadline, lecture and session from your account.
              Signing out ends this session on this device.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={signOut} icon={<LogOut size={14} />}>
              Sign out
            </Button>
            <Button variant="danger" onClick={() => setResetOpen(true)} loading={clearing} icon={<RefreshCw size={14} />}>
              Clear workspace
            </Button>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={resetOpen}
        title="Clear workspace?"
        description="This permanently removes every project, assignment, lecture and session from your account. Export a backup first if you want to keep anything."
        confirmLabel="Clear workspace"
        onConfirm={confirmReset}
        onClose={() => setResetOpen(false)}
      />
    </>
  )
}
