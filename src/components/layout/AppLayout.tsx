import { Suspense, useEffect } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { MobileBar, MobileNav } from './MobileNav'

function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-canvas" />
      <div className="absolute -right-40 -top-40 size-[38rem] rounded-full bg-accent/[0.09] blur-[120px]" />
      <div className="absolute -bottom-48 -left-40 size-[34rem] rounded-full bg-indigo-500/[0.08] blur-[120px]" />
      <div className="ambient-grid absolute inset-0 opacity-60" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
    </div>
  )
}

export function AppLayout() {
  const location = useLocation()
  const outlet = useOutlet()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  return (
    <div className="relative min-h-screen">
      <AmbientBackground />

      <div className="relative z-10 flex min-h-screen">
        <Sidebar />

        <main className="min-w-0 flex-1">
          <MobileBar />

          <div className="mx-auto w-full max-w-[1500px] px-5 pb-28 pt-6 sm:px-8 lg:px-10 lg:pb-10 lg:pt-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <Suspense
                  fallback={
                    <div className="grid min-h-[40vh] place-items-center">
                      <div className="flex items-center gap-2 text-xs text-faint">
                        <Loader2 size={14} className="animate-spin text-accent" />
                        Loading page…
                      </div>
                    </div>
                  }
                >
                  {outlet}
                </Suspense>
              </motion.div>
            </AnimatePresence>

            <footer className="mt-10 flex flex-col gap-2 border-t border-line pt-5 text-[11px] text-faint sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-2">
                <span className="size-1 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
                ProTask · synced securely to your account
              </span>
              <span className="font-mono tracking-wide">CLOUD SYNC · V1.0</span>
            </footer>
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  )
}
