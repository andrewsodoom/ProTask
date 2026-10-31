import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { readJSON, writeJSON } from '../lib/storage'

const SOUND_KEY = 'ProTask:sound:v1'

type SoundContextValue = {
  enabled: boolean
  setEnabled: (enabled: boolean) => void
  toggle: () => void
  playClick: () => void
}

const SoundContext = createContext<SoundContextValue | null>(null)

function getInitialEnabled(): boolean {
  return readJSON<boolean>(SOUND_KEY, true)
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(getInitialEnabled)
  const audioPoolRef = useRef<HTMLAudioElement[]>([])

  useEffect(() => {
    const pool = Array.from({ length: 3 }, () => {
      const audio = new Audio(`${import.meta.env.BASE_URL}sounds/select-click.mp3`)
      audio.preload = 'auto'
      audio.volume = 0.32
      audio.load()
      return audio
    })
    audioPoolRef.current = pool
    return () => {
      for (const audio of pool) audio.pause()
      audioPoolRef.current = []
    }
  }, [])

  useEffect(() => {
    writeJSON(SOUND_KEY, enabled)
  }, [enabled])

  const playClick = useCallback(() => {
    if (!enabled) return
    const pool = audioPoolRef.current
    if (!pool.length) return
    const audio = pool.find((entry) => entry.paused || entry.ended) ?? pool[0]
    try {
      audio.currentTime = 0
      void audio.play().catch(() => undefined)
    } catch {
      // Playback can be blocked until the browser has a user gesture.
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const control = target.closest(
        'button, a[href], [role="button"], [role="link"], input[type="button"], input[type="submit"], summary, [data-click-sound]',
      )
      if (!control) return
      if (control instanceof HTMLButtonElement && control.disabled) return
      if (control instanceof HTMLInputElement && control.disabled) return
      if (control.getAttribute('aria-disabled') === 'true') return
      if (control.closest('[data-click-sound="off"]')) return
      playClick()
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [enabled, playClick])

  const setEnabled = useCallback((next: boolean) => setEnabledState(next), [])
  const toggle = useCallback(() => setEnabledState((current) => !current), [])

  const value = useMemo<SoundContextValue>(
    () => ({ enabled, setEnabled, toggle, playClick }),
    [enabled, setEnabled, toggle, playClick],
  )

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
}

export function useSound(): SoundContextValue {
  const context = useContext(SoundContext)
  if (!context) throw new Error('useSound must be used inside SoundProvider')
  return context
}
