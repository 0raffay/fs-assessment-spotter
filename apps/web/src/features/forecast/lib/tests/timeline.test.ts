import { describe, expect, it } from 'vitest'

import { hourLabel, hourOf, hourToPercent, timelineTicks } from '../timeline'

const START = '2026-11-11T22:00:00.000Z' // 16:00 in Chicago

describe('timeline helpers', () => {
  it('labels ticks with local clock times and "Now" at hour 0', () => {
    const ticks = timelineTicks(START, 'America/Chicago', 12)
    expect(ticks.map((t) => t.label)).toEqual(['Now', '04:00', '16:00', '04:00', '16:00'])
    expect(ticks.map((t) => t.percent)).toEqual([0, 25, 50, 75, 100])
  })

  it('maps instants to clamped forecast hours', () => {
    expect(hourOf(START, '2026-11-12T12:00:00.000Z')).toBe(14)
    expect(hourOf(START, '2026-11-10T00:00:00.000Z')).toBe(0)
    expect(hourOf(START, '2026-11-20T00:00:00.000Z')).toBe(48)
  })

  it('formats an hour label and its position', () => {
    expect(hourLabel(START, 14, 'America/Chicago')).toBe('Thu 06:00')
    expect(hourToPercent(24)).toBe(50)
  })
})
