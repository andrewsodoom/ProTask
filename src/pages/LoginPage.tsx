import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { AuthShell } from '../components/auth/AuthShell'
import { Button } from '../components/ui/Button'
import { Field, inputClass } from '../components/ui/Field'
import { useAuth } from '../context/AuthContext'
import { cn } from '../lib/utils'

export function LoginPage() {
  const { signIn, configured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Enter your email and password to continue.')
      return
    }
    setLoading(true)
    const result = await signIn(email, password)
    setLoading(false)
    if (result.ok) navigate(from, { replace: true })
    else setError(result.error)
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to pick up your term exactly where you left it."
      footer={
        <>
          New to ProTask?{' '}
          <Link to="/signup" className="font-medium text-accent hover:text-accent">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!configured && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.07] px-3 py-2.5 text-xs leading-relaxed text-amber-100"
          >
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to enable sign in.
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-3 py-2.5 text-xs leading-relaxed text-rose-200"
          >
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <Field label="Email" htmlFor="login-email">
          <div className="relative">
            <Mail
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
            />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@university.edu"
              className={cn(inputClass, 'pl-9')}
            />
          </div>
        </Field>

        <Field label="Password" htmlFor="login-password">
          <div className="relative">
            <Lock
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
            />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className={cn(inputClass, 'px-9')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-faint transition hover:bg-surface-3 hover:text-ink-soft"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </Field>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          className="w-full"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthShell>
  )
}
