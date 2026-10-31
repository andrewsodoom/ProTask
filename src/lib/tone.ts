import type { BadgeTone } from '../components/ui/Badge'
import type { Priority, ProjectStatus, Tone } from '../data/models'

type ToneStyle = {
  badge: BadgeTone
  chip: string
  bar: string
  glow: string
  icon: string
  border: string
  dot: string
}

export const TONE_STYLES: Record<Tone, ToneStyle> = {
  cyan: {
    badge: 'cyan',
    chip: 'border-accent/20 bg-accent/10 text-accent',
    bar: 'from-accent to-accent-strong',
    glow: 'shadow-[0_0_12px_rgba(34,211,238,0.55)]',
    icon: 'border-accent/20 bg-accent/10 text-accent',
    border: 'border-l-accent',
    dot: 'bg-accent shadow-[0_0_8px_rgba(34,211,238,0.9)]',
  },
  violet: {
    badge: 'violet',
    chip: 'border-violet-400/20 bg-violet-400/10 text-violet-300',
    bar: 'from-violet-400 to-indigo-500',
    glow: 'shadow-[0_0_12px_rgba(167,139,250,0.5)]',
    icon: 'border-violet-400/20 bg-violet-400/10 text-violet-300',
    border: 'border-l-violet-400',
    dot: 'bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.9)]',
  },
  emerald: {
    badge: 'emerald',
    chip: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    bar: 'from-emerald-400 to-teal-500',
    glow: 'shadow-[0_0_12px_rgba(52,211,153,0.5)]',
    icon: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    border: 'border-l-emerald-400',
    dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]',
  },
  amber: {
    badge: 'amber',
    chip: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
    bar: 'from-amber-300 to-orange-500',
    glow: 'shadow-[0_0_12px_rgba(251,191,36,0.45)]',
    icon: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
    border: 'border-l-amber-400',
    dot: 'bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.9)]',
  },
  rose: {
    badge: 'rose',
    chip: 'border-rose-400/20 bg-rose-400/10 text-rose-300',
    bar: 'from-rose-400 to-pink-500',
    glow: 'shadow-[0_0_12px_rgba(251,113,133,0.45)]',
    icon: 'border-rose-400/20 bg-rose-400/10 text-rose-300',
    border: 'border-l-rose-400',
    dot: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.9)]',
  },
}

export const STATUS_TONE: Record<ProjectStatus, BadgeTone> = {
  Planning: 'slate',
  'In build': 'cyan',
  Research: 'violet',
  Polish: 'emerald',
  Shipped: 'amber',
}

export const PRIORITY_TONE: Record<Priority, BadgeTone> = {
  High: 'rose',
  Medium: 'amber',
  Low: 'slate',
}

export const PRIORITY_DOT: Record<Priority, string> = {
  High: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.9)]',
  Medium: 'bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.9)]',
  Low: 'bg-faint',
}

export const PROJECT_STATUSES: ProjectStatus[] = [
  'Planning',
  'In build',
  'Research',
  'Polish',
  'Shipped',
]

export const PRIORITIES: Priority[] = ['High', 'Medium', 'Low']

export const TONES: Tone[] = ['cyan', 'violet', 'emerald', 'amber', 'rose']
