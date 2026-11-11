import { describe, expect, it } from 'vitest'

import { fixturePlan } from '@/tests/fixtures'
import type { Checkpoint, CheckpointId, RiskLevel, Route } from '@/types'

import { countByFilter, filterCheckpoints, longestRoute, profileSegments } from '../checkpoints'

const plan = fixturePlan()
const route = plan.routes[0]!
const base = route.checkpoints[0]!

function at(level: RiskLevel | null, mile: number, segmentMiles = 25): Checkpoint {
  const id = `cp-${mile}` as CheckpointId
  if (level === null)
    return { ...base, id, mile, segmentMiles, forecast: { status: 'unavailable' } }
  if (base.forecast.status !== 'available') throw new Error('fixture needs a forecast')
  return { ...base, id, mile, segmentMiles, forecast: { ...base.forecast, level } }
}

const checkpoints = [
  at('low', 0),
  at('moderate', 25),
  at('high', 50),
  at('no_travel', 75),
  at(null, 100),
]

describe('filterCheckpoints', () => {
  it('keeps everything under "all", including ones without a forecast', () => {
    expect(filterCheckpoints(checkpoints, 'all')).toHaveLength(5)
  })

  it('keeps levels at or above the filter and drops missing forecasts', () => {
    expect(filterCheckpoints(checkpoints, 'moderate').map((c) => c.mile)).toEqual([25, 50, 75])
    expect(filterCheckpoints(checkpoints, 'high').map((c) => c.mile)).toEqual([50, 75])
  })

  it('counts each filter', () => {
    expect(countByFilter(checkpoints)).toEqual({ all: 5, moderate: 3, high: 2 })
  })
})

describe('profileSegments', () => {
  const short: Route = { ...route, distanceMiles: 110, checkpoints }

  it('scales against the given miles and clips the last segment at the route end', () => {
    const segments = profileSegments(short, 220)
    expect(segments.map((s) => s.start)).toEqual([0, 25 / 220, 50 / 220, 75 / 220, 100 / 220])
    expect(segments.at(-1)?.width).toBeCloseTo(10 / 220)
    expect(segments.map((s) => s.level)).toEqual(['low', 'moderate', 'high', 'no_travel', null])
  })

  it('never divides by zero', () => {
    expect(profileSegments(short, 0)[1]?.start).toBe(25)
  })

  it('uses the longest route as the shared scale', () => {
    expect(longestRoute(plan.routes)).toBe(Math.max(...plan.routes.map((r) => r.distanceMiles)))
    expect(longestRoute([])).toBe(0)
  })
})
