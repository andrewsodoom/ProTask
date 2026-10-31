import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import { AuthShell } from '../components/auth/AuthShell'
import { Button } from '../components/ui/Button'
import { Field, inputClass } from '../components/ui/Field'
import { useAuth } from '../context/AuthContext'
import { cn, isValidEmail } from '../lib/utils'

const strengthLabels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']
const strengthColors = [
  'bg-subtle',
  'bg-rose-400',
  'bg-amber-300',
  'bg-accent',
  'bg-emerald-400',
]

export function SignupPage() {
  const { signUp, configured } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [terms, setTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  const strength = useMemo(() => {
    if (!password) return 0
    return [
      password.length >= 8,
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length
  }, [password])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setNotice('')

    if (name.trim().length < 2) {
      setError('Please enter your full name.')
      return
    }
    if (!isValidEmail(email.trim())) {
      setError('Please enter a valid email address.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (!terms) {
      setError('Please accept the terms to create your workspace.')
      return
    }

    setLoading(true)
    const result = await signUp(name, email, password)
    setLoading(false)
    if (result.ok) {
      if (result.needsConfirmation) {
        setNotice('Check your inbox and confirm your email address to finish creating your account.')
      } else {
        navigate('/', { replace: true })
      }
    } else {
      setError(result.error)
    }
  }

  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Set up your account, then add your real modules, deadlines and builds."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent hover:text-accent">
            Sign in
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
            Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to enable account creation.
          </div>
        )}
        {notice && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-2.5 text-xs leading-relaxed text-emerald-100"
          >
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            {notice}
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

        <Field label="Full name" htmlFor="signup-name">
          <div className="relative">
            <User
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
            />
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Andre Kimani"
              className={cn(inputClass, 'pl-9')}
            />
          </div>
        </Field>

        <Field label="Email" htmlFor="signup-email">
          <div className="relative">
            <Mail
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
            />
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@university.edu"
              className={cn(inputClass, 'pl-9')}
            />
          </div>
        </Field>

        <Field label="Password" htmlFor="signup-password">
          <div className="relative">
            <Lock
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
            />
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
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

        {password && (
          <div>
            <div className="flex gap-1">
              {Array.from({ length: 4 }, (_, index) => (
                <span
                  key={index}
                  className={cn(
                    'h-1 flex-1 rounded-full transition',
                    index < strength ? strengthColors[strength] : 'bg-surface-3',
                  )}
                />
              ))}
            </div>
            <p className="mt-1.5 text-[10px] text-faint">
              Password strength:{' '}
              <span className="text-ink-soft">{strengthLabels[strength]}</span>
            </p>
          </div>
        )}

        <Field label="Confirm password" htmlFor="signup-confirm">
          <div className="relative">
            <Lock
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
            />
            <input
              id="signup-confirm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="Repeat your password"
              className={cn(inputClass, 'pl-9')}
            />
          </div>
        </Field>

        <label className="flex cursor-pointer items-start gap-2 text-[11px] leading-relaxed text-muted">
          <input
            type="checkbox"
            checked={terms}
            onChange={(event) => setTerms(event.target.checked)}
            className="mt-0.5 size-3.5 rounded border-line-strong bg-surface-3 accent-accent"
          />
          I agree to the ProTask terms of use and understand my workspace is stored
          securely in my account.
        </label>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          className="w-full"
        >
          {loading ? 'Creating workspace…' : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  )
}
