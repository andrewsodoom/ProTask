import { Link } from 'react-router-dom'
import { Compass, Home } from 'lucide-react'
import { buttonStyles } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="fade-up flex min-h-[62vh] flex-col items-center justify-center text-center">
      <div className="grid size-16 place-items-center rounded-2xl border border-accent/15 bg-accent/[0.06] text-accent">
        <Compass size={28} />
      </div>
      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.24em] text-accent/70">
        Error 404
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        This page left the timetable
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        The route you followed does not exist. Head back to the overview and pick up where you
        left off.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Link to="/" className={buttonStyles('primary', 'md')}>
          <Home size={15} />
          Back to overview
        </Link>
        <Link to="/academic" className={buttonStyles('secondary', 'md')}>
          Open academic queue
        </Link>
      </div>
    </div>
  )
}
