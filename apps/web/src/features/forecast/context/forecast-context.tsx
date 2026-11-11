import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { FORECAST_HOURS, type ForecastState } from '../types'

import { ForecastContextProvider } from './forecast-store'

const PLAY_STEP_MS = 600

const clamp = (hour: number) => Math.min(Math.max(Math.round(hour), 0), FORECAST_HOURS)

interface ForecastProviderProps {
  /** Starting hour (e.g. the departure hour). Remount with a `key` to reset for a new plan. */
  initialHour: number
  initiallyOpen: boolean
  children: ReactNode
}

/** Heatmap hour, playback and whether the forecast panel is open. */
export function ForecastProvider({ initialHour, initiallyOpen, children }: ForecastProviderProps) {
  const [hour, setHourState] = useState(() => clamp(initialHour))
  const [isPlaying, setPlaying] = useState(false)
  const [isOpen, setOpen] = useState(initiallyOpen)

  const setHour = useCallback((next: number) => setHourState(clamp(next)), [])

  // Playback: one hour every 600ms, stopping at +48h.
  useEffect(() => {
    if (!isPlaying) return
    const timer = window.setInterval(() => {
      setHourState((current) => {
        if (current >= FORECAST_HOURS) {
          setPlaying(false)
          return current
        }
        return current + 1
      })
    }, PLAY_STEP_MS)
    return () => window.clearInterval(timer)
  }, [isPlaying])

  const value = useMemo<ForecastState>(
    () => ({
      hour,
      setHour: (next) => {
        setPlaying(false)
        setHour(next)
      },
      step: (delta) => {
        setPlaying(false)
        setHourState((current) => clamp(current + delta))
      },
      isPlaying,
      togglePlay: () => {
        if (!isPlaying && hour >= FORECAST_HOURS) setHourState(0)
        setPlaying(!isPlaying)
      },
      isOpen,
      setOpen,
    }),
    [hour, isPlaying, isOpen, setHour],
  )

  return <ForecastContextProvider value={value}>{children}</ForecastContextProvider>
}
