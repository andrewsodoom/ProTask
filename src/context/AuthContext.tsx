import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import type { AuthUser } from '../data/models'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { initials, isValidEmail } from '../lib/utils'

type AuthResult =
  | { ok: true; needsConfirmation?: boolean }
  | { ok: false; error: string }

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  configured: boolean
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
  updateName: (name: string) => Promise<AuthResult>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function displayName(user: User): string {
  const name = user.user_metadata?.name
  if (typeof name === 'string' && name.trim()) return name.trim()
  return user.email?.split('@')[0] ?? 'Student'
}

const toAuthUser = (user: User): AuthUser => ({
  id: user.id,
  name: displayName(user),
  email: user.email ?? '',
  createdAt: user.created_at,
})

function authError(message: string): string {
  const normalized = message.toLowerCase()
  if (normalized.includes('invalid login credentials')) {
    return 'That email or password is incorrect.'
  }
  if (normalized.includes('email not confirmed')) {
    return 'Confirm your email address before signing in.'
  }
  if (normalized.includes('user already registered')) {
    return 'An account with this email already exists.'
  }
  if (normalized.includes('password')) {
    return message
  }
  return message || 'Authentication failed. Try again.'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let mounted = true
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setUser(data.session?.user ? toAuthUser(data.session.user) : null)
      setLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setUser(session?.user ? toAuthUser(session.user) : null)
      setLoading(false)
    })

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) {
      return { ok: false, error: 'Supabase is not configured for this build.' }
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error) return { ok: false, error: authError(error.message) }
    if (data.user) setUser(toAuthUser(data.user))
    return { ok: true }
  }, [])

  const signUp = useCallback(
    async (name: string, email: string, password: string): Promise<AuthResult> => {
      if (!supabase) {
        return { ok: false, error: 'Supabase is not configured for this build.' }
      }
      const cleanName = name.trim()
      const normalized = email.trim().toLowerCase()

      if (cleanName.length < 2) {
        return { ok: false, error: 'Please enter your full name.' }
      }
      if (!isValidEmail(normalized)) {
        return { ok: false, error: 'Please enter a valid email address.' }
      }
      if (password.length < 8) {
        return { ok: false, error: 'Password must be at least 8 characters.' }
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalized,
        password,
        options: {
          data: { name: cleanName },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      })
      if (error) return { ok: false, error: authError(error.message) }
      if (!data.session) return { ok: true, needsConfirmation: true }
      if (data.user) setUser(toAuthUser(data.user))
      return { ok: true }
    },
    [],
  )

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
  }, [])

  const updateName = useCallback(
    async (name: string): Promise<AuthResult> => {
      const cleanName = name.trim()
      if (cleanName.length < 2) {
        return { ok: false, error: 'Name must be at least 2 characters.' }
      }
      if (!supabase) {
        return { ok: false, error: 'Supabase is not configured for this build.' }
      }
      if (!user) return { ok: false, error: 'You are not signed in.' }

      const { data, error } = await supabase.auth.updateUser({
        data: { name: cleanName },
      })
      if (error) return { ok: false, error: error.message }
      if (data.user) setUser(toAuthUser(data.user))
      return { ok: true }
    },
    [user],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configured: isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
      updateName,
    }),
    [user, loading, signIn, signUp, signOut, updateName],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

export function userInitials(name: string): string {
  return initials(name)
}
