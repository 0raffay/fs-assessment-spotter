import type { WeatherCondition } from '@/types'

import { CONDITION_UNITS } from './risk'

const numberFormat = new Intl.NumberFormat('en-US')

export function formatNumber(value: number): string {
  return numberFormat.format(Math.round(value))
}

/** `14h 50m`, `45m`. */
export function formatDuration(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes))
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}m`
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}

/** `+2h 10m`, `−45m`. */
export function formatDurationDelta(deltaMinutes: number): string {
  const sign = deltaMinutes >= 0 ? '+' : '−'
  return `${sign}${formatDuration(Math.abs(deltaMinutes))}`
}

export function formatMiles(miles: number): string {
  return `${formatNumber(miles)} mi`
}

function parts(iso: string, timeZone: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', ...options }).formatToParts(
    new Date(iso),
  )
}

function part(list: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return list.find((item) => item.type === type)?.value ?? ''
}

/** `11:50` in the place's own time zone. */
export function formatClock(iso: string, timeZone: string): string {
  const list = parts(iso, timeZone, { hour: '2-digit', minute: '2-digit' })
  return `${part(list, 'hour')}:${part(list, 'minute')}`
}

/** `Tue`. */
export function formatWeekday(iso: string, timeZone: string): string {
  return part(parts(iso, timeZone, { weekday: 'short' }), 'weekday')
}

/** `CST`. */
export function formatZone(iso: string, timeZone: string): string {
  return part(parts(iso, timeZone, { timeZoneName: 'short' }), 'timeZoneName')
}

/** `Tue 11:50`. */
export function formatDayClock(iso: string, timeZone: string): string {
  return `${formatWeekday(iso, timeZone)} ${formatClock(iso, timeZone)}`
}

/** `Tue, Nov 12`. */
export function formatDate(iso: string, timeZone: string): string {
  const list = parts(iso, timeZone, { weekday: 'short', month: 'short', day: 'numeric' })
  return `${part(list, 'weekday')}, ${part(list, 'month')} ${part(list, 'day')}`
}

/** `28 mph`, `0.31 in/hr`. */
export function formatWeatherValue(condition: WeatherCondition, value: number): string {
  const rounded =
    condition === 'wind' ? String(Math.round(value)) : value.toFixed(2).replace(/0$/, '')
  return `${rounded} ${CONDITION_UNITS[condition]}`
}

/** Just the number part of a weather value, for big displays. */
export function formatWeatherNumber(condition: WeatherCondition, value: number): string {
  return condition === 'wind' ? String(Math.round(value)) : value.toFixed(2).replace(/0$/, '')
}

/** Whole hours between two instants (b − a). */
export function hoursBetween(a: string | Date, b: string | Date): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 3_600_000
}

export function addHours(iso: string | Date, hours: number): Date {
  return new Date(new Date(iso).getTime() + hours * 3_600_000)
}
