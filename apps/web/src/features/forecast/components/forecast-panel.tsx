import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FlagIcon,
  PauseIcon,
  PlayIcon,
  XIcon,
} from 'lucide-react'
import { useEffect, useRef } from 'react'

import { IconButton } from '@/components/icon-button'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { formatZone } from '@/lib/format'
import { RISK_META, riskFromIndex } from '@/lib/risk'
import { cn } from '@/lib/utils'
import { RISK_LEVELS } from '@/types'

import { useForecast } from '../context/forecast-store'
import { hourLabel, hourOf, hourToPercent, timelineTicks } from '../lib/timeline'
import { FORECAST_HOURS, type Heatmap } from '../types'

/** Bar height per risk index: worse hours stand taller. */
const BAR_HEIGHT = [8, 13, 18, 24, 26] as const

interface ForecastPanelProps {
  heatmap: Heatmap
  /** Selected route's departure and arrival, shown on the timeline. */
  departureAt: string
  arrivalAt: string
  /** Times are shown in the trip's origin zone. */
  timeZone: string
  compact?: boolean
}

/** The 0–48 h forecast timeline (DESIGN.md › forecast-panel). */
export function ForecastPanel({
  heatmap,
  departureAt,
  arrivalAt,
  timeZone,
  compact = false,
}: ForecastPanelProps) {
  const { hour, setHour, step, isPlaying, togglePlay, setOpen } = useForecast()
  const sliderRef = useRef<HTMLSpanElement>(null)
  const departHour = hourOf(heatmap.startsAt, departureAt)
  const arriveHour = hourOf(heatmap.startsAt, arrivalAt)
  const label = hourLabel(heatmap.startsAt, hour, timeZone)
  const zone = formatZone(heatmap.startsAt, timeZone)
  const ticks = timelineTicks(heatmap.startsAt, timeZone, compact ? 12 : 6)

  // The generated Slider has no prop for its thumb's name, so label the thumb directly.
  useEffect(() => {
    const thumb = sliderRef.current?.querySelector('[role="slider"]')
    thumb?.setAttribute('aria-label', 'Heatmap forecast hour')
    thumb?.setAttribute('aria-valuetext', `plus ${hour} hours, ${label}`)
  }, [hour, label])

  return (
    <div className={cn('flex flex-col gap-3.5', compact ? 'p-3.5' : 'px-[22px] py-[18px]')}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-ink-subtle text-[13px]">Heatmap hour</span>
          <span className="flex items-baseline gap-2 whitespace-nowrap">
            <span
              className={cn(
                'font-light tracking-[-0.8px] tabular-nums',
                compact ? 'text-[22px]' : 'text-[28px]',
              )}
              aria-live="polite"
            >
              {label}
            </span>
            <span className="text-ink-subtle text-[13px]">{zone}</span>
            <span className="bg-surface-3 text-ink-muted rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
              +{hour}h
            </span>
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {compact ? null : (
            <IconButton
              label="Previous hour"
              onClick={() => step(-1)}
              disabled={hour === 0}
              icon={<ChevronLeftIcon className="size-4" />}
            />
          )}
          <Button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause forecast' : 'Play forecast'}
            className="size-11 rounded-full transition-[background-color,box-shadow,transform] hover:shadow-[0_6px_20px_rgb(56_189_248/0.25)] active:scale-95"
          >
            {isPlaying ? (
              <PauseIcon className="size-4" fill="currentColor" />
            ) : (
              <PlayIcon className="size-4" fill="currentColor" />
            )}
          </Button>
          {compact ? null : (
            <>
              <IconButton
                label="Next hour"
                onClick={() => step(1)}
                disabled={hour === FORECAST_HOURS}
                icon={<ChevronRightIcon className="size-4" />}
              />
              <span aria-hidden className="bg-hairline-strong mx-1 h-[22px] w-px" />
            </>
          )}
          <IconButton
            label="Close forecast"
            onClick={() => setOpen(false)}
            icon={<XIcon className="size-4" />}
            className="text-ink-subtle"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="relative flex h-[26px] items-end gap-0.5" aria-hidden>
          <span
            className="bg-primary/10 absolute inset-y-[-3px] rounded-md"
            style={{
              left: `${hourToPercent(departHour)}%`,
              width: `${hourToPercent(arriveHour - departHour)}%`,
            }}
          />
          {heatmap.worstByHour.map((index, h) => {
            const level = riskFromIndex(index)
            return (
              <span
                key={h}
                onClick={() => setHour(h)}
                className={cn(
                  'relative min-w-0 flex-1 cursor-pointer rounded-[3px] transition-[opacity,transform] duration-200 hover:opacity-90',
                  RISK_META[level].bgClass,
                  h === hour
                    ? 'scale-y-110 opacity-100 shadow-[0_0_0_1.5px_var(--ink)]'
                    : 'opacity-45',
                )}
                style={{ height: BAR_HEIGHT[index] }}
              />
            )
          })}
        </div>

        <Slider
          ref={sliderRef}
          min={0}
          max={FORECAST_HOURS}
          step={1}
          value={[hour]}
          onValueChange={([next]) => next !== undefined && setHour(next)}
          className="[&_[data-slot=slider-range]]:bg-primary [&_[data-slot=slider-thumb]]:bg-ink [&_[data-slot=slider-track]]:bg-surface-4 py-2 [&_[data-slot=slider-thumb]]:size-[18px] [&_[data-slot=slider-thumb]]:border-0 [&_[data-slot=slider-thumb]]:shadow-[0_0_0_4px_rgb(56_189_248/0.35),0_2px_8px_rgb(0_0_0/0.5)]"
        />

        <div className="text-ink-subtle relative h-8 text-xs tabular-nums">
          {ticks.map((tick) => (
            <span
              key={tick.hour}
              className="absolute top-0 whitespace-nowrap"
              style={{
                left: `${tick.percent}%`,
                transform:
                  tick.hour === 0
                    ? 'none'
                    : tick.hour === FORECAST_HOURS
                      ? 'translateX(-100%)'
                      : 'translateX(-50%)',
              }}
            >
              {tick.label}
            </span>
          ))}
          <span
            className="text-primary absolute top-[17px] flex -translate-x-1/2 items-center gap-1 whitespace-nowrap"
            style={{ left: `${hourToPercent(departHour)}%` }}
          >
            <FlagIcon className="size-2.5" fill="currentColor" />
            Depart
          </span>
          {arriveHour > departHour + 4 ? (
            <span
              className="text-ink-muted absolute top-[17px] -translate-x-1/2 whitespace-nowrap"
              style={{ left: `${hourToPercent(arriveHour)}%` }}
            >
              Arrive
            </span>
          ) : null}
        </div>
      </div>

      {compact ? null : (
        <div className="border-hairline flex items-center justify-between gap-3 border-t pt-3">
          <div className="flex flex-wrap items-center gap-3.5">
            {RISK_LEVELS.map((level) => (
              <span key={level} className="text-ink-muted flex items-center gap-1.5 text-xs">
                <span className={cn('size-2.5 rounded-[4px]', RISK_META[level].bgClass)} />
                {RISK_META[level].label}
              </span>
            ))}
          </div>
          <span className="text-ink-subtle text-xs">
            Bars show the worst risk in the corridor, hour by hour
          </span>
        </div>
      )}
    </div>
  )
}
