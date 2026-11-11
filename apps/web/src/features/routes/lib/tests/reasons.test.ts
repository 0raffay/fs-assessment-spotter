import { describe, expect, it } from 'vitest'

import { formatReason } from '../reasons'

describe('formatReason', () => {
  it('formats every reason kind', () => {
    expect(
      formatReason({ kind: 'fewest_miles', level: 'severe', miles: 0, othersMiles: [50, 75] }),
    ).toBe('0 severe mi, others 50 and 75')
    expect(
      formatReason({ kind: 'fewest_miles', level: 'no_travel', miles: 0, othersMiles: [25] }),
    ).toBe('0 no travel mi, others 25')
    expect(
      formatReason({ kind: 'lowest_average_risk', value: 0.4, othersValues: [0.8, 1.1] }),
    ).toBe('Avg risk 0.40, others 0.80 and 1.10')
    expect(formatReason({ kind: 'shortest_time', minutes: 760 })).toBe('Shortest drive, 12h 40m')
    expect(formatReason({ kind: 'time_vs_fastest', deltaMinutes: 130 })).toBe('+2h 10m vs fastest')
  })
})
