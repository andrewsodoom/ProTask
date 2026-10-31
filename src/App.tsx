import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { SoundProvider } from './context/SoundContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { AppLayout } from './components/layout/AppLayout'
import { PublicOnly, RequireAuth } from './components/layout/Guards'

const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })),
)
const SignupPage = lazy(() =>
  import('./pages/SignupPage').then((module) => ({ default: module.SignupPage })),
)
const OverviewPage = lazy(() =>
  import('./pages/OverviewPage').then((module) => ({ default: module.OverviewPage })),
)
const StudyLogPage = lazy(() =>
  import('./pages/StudyLogPage').then((module) => ({ default: module.StudyLogPage })),
)
const ProjectsPage = lazy(() =>
  import('./pages/ProjectsPage').then((module) => ({ default: module.ProjectsPage })),
)
const AcademicPage = lazy(() =>
  import('./pages/AcademicPage').then((module) => ({ default: module.AcademicPage })),
)
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })),
)
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
)

function RouteFallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Loader2 size={15} className="animate-spin text-accent" />
        Loading Protask…
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <SoundProvider>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route element={<PublicOnly />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                  </Route>

                  <Route element={<RequireAuth />}>
                    <Route
                      element={
                        <DataProvider>
                          <AppLayout />
                        </DataProvider>
                      }
                    >
                      <Route index element={<OverviewPage />} />
                      <Route path="study-log" element={<StudyLogPage />} />
                      <Route path="projects" element={<ProjectsPage />} />
                      <Route path="academic" element={<AcademicPage />} />
                      <Route path="settings" element={<SettingsPage />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Route>
                  </Route>
                </Routes>
              </Suspense>
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </SoundProvider>
    </ThemeProvider>
  )
}
