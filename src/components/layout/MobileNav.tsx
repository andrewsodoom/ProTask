import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FolderKanban,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Settings,
  Timer,
} from 'lucide-react'
import { useAuth, userInitials } from '../../context/AuthContext'
import { ThemeToggle } from '../ui/ThemeToggle'
import { formatDate } from '../../lib/date'
import { cn } from '../../lib/utils'

const pageTitles: Record<string, string> = {
  '/': 'Overview',
  '/study-log': 'Study log',
  '/projects': 'Projects',
  '/academic': 'Academic',
  '/settings': 'Settings',
}

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/study-log', label: 'Study', icon: Timer },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/academic', label: 'Academic', icon: GraduationCap },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function MobileBar() {
  const { user } = useAuth()
  const location = useLocation()
  const title = pageTitles[location.pathname] ?? 'ProTask'

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-canvas/85 px-5 py-3 backdrop-blur-xl lg:hidden">
      <Link to="/" className="flex items-center gap-2.5">
        <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-accent via-accent to-sky-600 shadow-[0_0_20px_-4px_rgba(34,211,238,0.9)]">
          <Layers size={16} strokeWidth={2.4} className="text-accent-contrast" />
        </div>
        <span className="font-display text-sm font-semibold tracking-tight text-ink">
          ProTask
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <span className="hidden rounded-lg border border-line bg-surface px-2 py-1 text-[10px] text-muted min-[380px]:inline">
          {title} · {formatDate(new Date())}
        </span>
        <ThemeToggle />
        <Link
          to="/settings"
          aria-label="Open profile settings"
          className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-accent/80 to-indigo-500/80 font-display text-[10px] font-semibold text-accent-contrast ring-2 ring-accent/20"
        >
          {user ? userInitials(user.name) : 'SD'}
        </Link>
      </div>
    </header>
  )
}

export function MobileNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-panel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      aria-label="Primary navigation"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/25 to-transparent" />
      <div className="grid grid-cols-5 px-1 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'group relative flex flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[9px] font-medium transition',
                  isActive ? 'text-accent' : 'text-faint hover:text-ink-soft',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="mobile-nav-active"
                      className="absolute inset-x-2 inset-y-0.5 rounded-lg bg-accent/[0.09] shadow-[inset_0_0_0_1px_rgba(34,211,238,0.16)]"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <Icon size={17} className="relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
