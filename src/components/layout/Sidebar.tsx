import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FolderKanban,
  GraduationCap,
  Layers,
  LayoutDashboard,
  LogOut,
  Settings,
  Timer,
} from 'lucide-react'
import { useAuth, userInitials } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { ThemeToggle } from '../ui/ThemeToggle'
import { formatDate, isThisWeek } from '../../lib/date'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/study-log', label: 'Study log', icon: Timer },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/academic', label: 'Academic', icon: GraduationCap },
]

export function Sidebar() {
  const { user, signOut } = useAuth()
  const { projects, assignments, sessions } = useData()

  const openAssignments = assignments.filter((assignment) => !assignment.completed).length
  const dueThisWeek = assignments.filter((assignment) => isThisWeek(assignment.dueAt))
  const doneThisWeek = dueThisWeek.filter((assignment) => assignment.completed).length
  const weekPercent = dueThisWeek.length
    ? Math.round((doneThisWeek / dueThisWeek.length) * 100)
    : 0
  const weekMinutes = sessions
    .filter((session) => isThisWeek(session.date))
    .reduce((total, session) => total + session.minutes, 0)

  return (
    <aside className="sticky top-0 hidden h-screen w-[268px] shrink-0 flex-col border-r border-line bg-panel/70 px-4 py-5 backdrop-blur-xl lg:flex">
      <NavLink to="/" className="flex items-center gap-3 px-2">
        <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-accent via-accent to-sky-600 shadow-[0_0_28px_-6px_rgba(34,211,238,0.9)]">
          <Layers size={18} strokeWidth={2.4} className="text-accent-contrast" />
        </div>
        <div>
          <p className="font-display text-[15px] font-semibold tracking-tight text-ink">
            ProTask
          </p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-faint">
            Plan & build OS
          </p>
        </div>
      </NavLink>

      <nav className="mt-9 space-y-1" aria-label="Workspace">
        <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-faint">
          Workspace
        </p>
        {navItems.map((item) => {
          const Icon = item.icon
          const badge =
            item.to === '/projects'
              ? projects.length
              : item.to === '/academic'
                ? openAssignments
                : null
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
                  isActive
                    ? 'text-accent'
                    : 'text-muted hover:bg-surface hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl bg-accent/[0.08] shadow-[inset_0_0_0_1px_rgba(34,211,238,0.18)]"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
                  )}
                  <Icon
                    size={16}
                    className={cn(
                      'relative z-10',
                      isActive
                        ? 'text-accent'
                        : 'text-faint group-hover:text-ink-soft',
                    )}
                  />
                  <span className="relative z-10 flex-1 text-left">{item.label}</span>
                  {badge !== null && badge > 0 && (
                    <span
                      className={cn(
                        'relative z-10 rounded-md px-1.5 py-0.5 font-mono text-[10px]',
                        isActive
                          ? 'bg-accent/15 text-accent'
                          : 'bg-surface-3 text-muted',
                      )}
                    >
                      {badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-6 border-t border-line pt-4">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
              isActive
                ? 'bg-surface text-ink'
                : 'text-muted hover:bg-surface hover:text-ink',
            )
          }
        >
          <Settings size={16} className="text-faint group-hover:text-ink-soft" />
          Settings
        </NavLink>
      </div>

      <div className="mt-auto space-y-3 pt-6">
        <div className="rounded-2xl border border-line bg-gradient-to-b from-surface to-surface-2 p-4">
          <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.16em]">
            <span className="text-muted">This week</span>
            <span className="font-mono text-accent">{formatDate(new Date())}</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-sky-500 shadow-[0_0_12px_rgba(34,211,238,0.7)] transition-all duration-500"
              style={{ width: `${weekPercent}%` }}
            />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            {doneThisWeek}/{dueThisWeek.length} deadlines done
            <span className="mx-1.5 text-subtle">·</span>
            <span className="text-ink-soft">{Math.round(weekMinutes / 60)}h focused</span>
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2 px-3 py-2.5">
          <NavLink
            to="/settings"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent/80 to-indigo-500/80 font-display text-xs font-semibold text-accent-contrast ring-2 ring-accent/20"
            aria-label="Open profile settings"
          >
            {user ? userInitials(user.name) : 'SD'}
          </NavLink>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">
              {user?.name ?? 'StudyDeck'}
            </p>
            <p className="truncate text-[11px] text-faint">{user?.email ?? ''}</p>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <ThemeToggle />
            <button
              type="button"
              onClick={signOut}
              title="Sign out"
              aria-label="Sign out"
              className="grid size-8 place-items-center rounded-lg text-faint transition hover:bg-surface-3 hover:text-rose-300"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
