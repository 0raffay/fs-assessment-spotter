import { AnimatePresence, motion } from 'motion/react'
import {
  ChevronUpIcon,
  ClockIcon,
  LoaderCircleIcon,
  RotateCwIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import type { CSSProperties, Ref } from 'react'

import { FloatingPanel } from '@/components/floating-panel'
import { toApiError } from '@/lib/api'
import { panelVariants } from '@/lib/motion'

import { useForecast } from '../context/forecast-store'
import { hourLabel } from '../lib/timeline'
import type { Heatmap } from '../types'

import { ForecastPanel } from './forecast-panel'

interface ForecastDockProps {
  heatmap: Heatmap | undefined
  isLoading: boolean
  /** Set when the heatmap request failed; the dock then offers a retry instead of a spinner. */
  error?: unknown
  onRetry?: () => void
  retrying?: boolean
  departureAt: string
  arrivalAt: string
  timeZone: string
  compact: boolean
  /** Where the dock sits inside the map frame. */
  style: CSSProperties
  /** Receives the dock element, e.g. to measure the height it takes over the map. */
  ref?: Ref<HTMLDivElement>
}

/** The forecast along the bottom of the map: a chip when closed, the timeline when open. */
export function ForecastDock({
  heatmap,
  isLoading,
  error,
  onRetry,
  retrying = false,
  departureAt,
  arrivalAt,
  timeZone,
  compact,
  style,
  ref,
}: ForecastDockProps) {
  const { isOpen, setOpen, hour } = useForecast()
  const failed = Boolean(error) && !heatmap && !retrying
  const message = failed ? toApiError(error).userMessage : ''

  return (
    <div ref={ref} className="pointer-events-none absolute z-20 flex justify-center" style={style}>
      <AnimatePresence mode="wait" initial={false}>
        {isOpen && heatmap ? (
          <FloatingPanel
            key="panel"
            from="up"
            aria-label="Forecast timeline"
            className="pointer-events-auto w-full"
          >
            <ForecastPanel
              heatmap={heatmap}
              departureAt={departureAt}
              arrivalAt={arrivalAt}
              timeZone={timeZone}
              compact={compact}
            />
          </FloatingPanel>
        ) : failed ? (
          <motion.div
            key="error"
            role="alert"
            variants={panelVariants('up')}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="border-hairline-strong bg-surface-2 pointer-events-auto flex min-h-[42px] max-w-full items-center gap-2.5 rounded-full border py-1 pr-1 pl-3.5 shadow-[0_18px_44px_rgb(0_0_0/0.5)]"
          >
            <TriangleAlertIcon className="text-risk-high size-4 shrink-0" strokeWidth={1.75} />
            <span className="min-w-0 text-sm">
              <span className="font-medium">Forecast unavailable</span>
              <span className="text-ink-subtle hidden md:inline"> · {message}</span>
              <span className="sr-only md:hidden"> {message}</span>
            </span>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="bg-surface-3 hover:bg-surface-4 focus-visible:ring-ring/45 flex h-[34px] shrink-0 items-center gap-1.5 rounded-full px-3 text-sm transition-[background-color,transform] outline-none focus-visible:ring-3 active:scale-[0.97]"
              >
                <RotateCwIcon className="size-3.5" strokeWidth={1.75} />
                Retry
              </button>
            ) : null}
          </motion.div>
        ) : (
          <motion.button
            key="chip"
            type="button"
            variants={panelVariants('up')}
            initial="hidden"
            animate="visible"
            exit="exit"
            disabled={!heatmap}
            onClick={() => setOpen(true)}
            aria-label={heatmap ? `Open forecast timeline, plus ${hour} hours` : 'Loading forecast'}
            className="border-hairline-strong bg-surface-2 hover:bg-surface-3 focus-visible:ring-ring/45 pointer-events-auto flex h-[42px] items-center gap-2.5 rounded-full border pr-2 pl-3.5 shadow-[0_18px_44px_rgb(0_0_0/0.5)] transition-[background-color,transform] outline-none focus-visible:ring-3 active:scale-[0.97] disabled:opacity-70"
          >
            {isLoading || !heatmap ? (
              <>
                <LoaderCircleIcon className="text-primary size-4 animate-spin" />
                <span className="text-ink-muted pr-2 text-sm">Loading forecast</span>
              </>
            ) : (
              <>
                <ClockIcon className="text-primary size-4" strokeWidth={1.75} />
                <span className="text-sm tabular-nums">
                  {hourLabel(heatmap.startsAt, hour, timeZone)}
                </span>
                <span className="bg-surface-4 text-ink-muted rounded-full px-2 py-0.5 text-xs tabular-nums">
                  +{hour}h
                </span>
                <ChevronUpIcon className="text-ink-subtle size-4" strokeWidth={1.75} />
              </>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
