import { addHours, formatClock, formatDayClock, hoursBetween } from '@/lib/format'

import { FORECAST_HOURS } from '../types'

export interface TimelineTick {
  hour: number
  label: string
  /** Percent from the left of the track. */
  percent: number
}

export const hourToPercent = (hour: number) => (hour / FORECAST_HOURS) * 100

/** Clock-time ticks every `stepHours`, with hour 0 labelled "Now". */
export function timelineTicks(
  startsAt: string,
  timeZone: string,
  stepHours: number,
): TimelineTick[] {
  const ticks: TimelineTick[] = []
  for (let hour = 0; hour <= FORECAST_HOURS; hour += stepHours) {
    ticks.push({
      hour,
      label: hour === 0 ? 'Now' : formatClock(addHours(startsAt, hour).toISOString(), timeZone),
      percent: hourToPercent(hour),
    })
  }
  return ticks
}

/** The forecast hour an instant falls in, clamped to the slider's range. */
export function hourOf(startsAt: string, instant: string): number {
  return Math.min(Math.max(Math.round(hoursBetween(startsAt, instant)), 0), FORECAST_HOURS)
}

/** "Tue 12:00" for a forecast hour. */
export function hourLabel(startsAt: string, hour: number, timeZone: string): string {
  return formatDayClock(addHours(startsAt, hour).toISOString(), timeZone)
}
