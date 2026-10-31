import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

function AuthLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Loader2 size={15} className="animate-spin text-accent" />
        Checking your session…
      </div>
    </div>
  )
}

export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <AuthLoading />
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

export function PublicOnly() {
  const { user, loading } = useAuth()
  if (loading) return <AuthLoading />
  if (user) return <Navigate to="/" replace />
  return <Outlet />
}
