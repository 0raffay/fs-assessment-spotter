import { describe, expect, it } from 'vitest'

import {
  formatClock,
  formatDate,
  formatDayClock,
  formatDuration,
  formatDurationDelta,
  formatMiles,
  formatWeatherValue,
  formatZone,
} from '../format'

describe('format', () => {
  it('formats durations', () => {
    expect(formatDuration(890)).toBe('14h 50m')
    expect(formatDuration(120)).toBe('2h')
    expect(formatDuration(45)).toBe('45m')
    expect(formatDurationDelta(130)).toBe('+2h 10m')
    expect(formatDurationDelta(-45)).toBe('−45m')
  })

  it('formats distances with separators', () => {
    expect(formatMiles(1234.4)).toBe('1,234 mi')
  })

  it('formats times in the place’s own zone', () => {
    const iso = '2026-11-12T17:50:00Z'
    expect(formatClock(iso, 'America/Chicago')).toBe('11:50')
    expect(formatZone(iso, 'America/Chicago')).toBe('CST')
    expect(formatDayClock(iso, 'America/Denver')).toBe('Thu 10:50')
    expect(formatDate(iso, 'America/Chicago')).toBe('Thu, Nov 12')
  })

  it('formats weather values with units', () => {
    expect(formatWeatherValue('wind', 28.4)).toBe('28 mph')
    expect(formatWeatherValue('rain', 0.31)).toBe('0.31 in/hr')
    expect(formatWeatherValue('snow', 0.5)).toBe('0.5 in/hr')
  })
})
