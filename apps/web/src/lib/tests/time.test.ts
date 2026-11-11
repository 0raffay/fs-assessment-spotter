import { describe, expect, it } from 'vitest'

import { isoToZonedParts, tomorrowAt, zonedDateTimeToIso } from '../time'

describe('time zones', () => {
  it('converts a wall-clock time in a zone to UTC', () => {
    expect(zonedDateTimeToIso('2026-11-12', '06:00', 'America/Chicago')).toBe(
      '2026-11-12T12:00:00.000Z',
    )
    expect(zonedDateTimeToIso('2026-07-01', '06:00', 'America/Denver')).toBe(
      '2026-07-01T12:00:00.000Z',
    )
  })

  it('round-trips through wall-clock parts', () => {
    const iso = zonedDateTimeToIso('2026-03-08', '09:30', 'America/New_York')
    expect(isoToZonedParts(iso, 'America/New_York')).toEqual({ date: '2026-03-08', time: '09:30' })
  })

  it('builds tomorrow at a time', () => {
    expect(tomorrowAt('06:00', 'UTC', new Date('2026-11-11T22:00:00Z'))).toEqual({
      date: '2026-11-12',
      time: '06:00',
    })
  })
})
