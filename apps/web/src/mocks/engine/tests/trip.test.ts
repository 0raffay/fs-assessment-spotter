import { describe, expect, it } from 'vitest'

import { tripPlanSchema, type TripRequest } from '@/types'

import { findPlace } from '../places'
import { buildTripPlan, compareRoutes } from '../trip'

function request(overrides: Partial<TripRequest> = {}): TripRequest {
  const origin = findPlace('place:dallas-tx')
  const destination = findPlace('place:denver-co')
  if (!origin || !destination) throw new Error('fixture places missing')
  return {
    origin,
    destination,
    departureAt: '2026-11-12T12:00:00.000Z',
    loadWeightLb: 42_000,
    intervalMiles: 25,
    ...overrides,
  }
}

describe('buildTripPlan', () => {
  const now = new Date('2026-11-11T22:20:00Z')

  it('returns a plan that satisfies the API contract', () => {
    const plan = buildTripPlan(request(), now)
    expect(tripPlanSchema.safeParse(plan).success).toBe(true)
    expect(plan.routes).toHaveLength(3)
  })

  it('ranks routes by the PDF order and recommends rank 1', () => {
    const plan = buildTripPlan(request(), now)
    const sorted = [...plan.routes].sort(compareRoutes)
    expect(plan.routes.map((r) => r.id)).toEqual(sorted.map((r) => r.id))
    expect(plan.routes[0]?.isRecommended).toBe(true)
    expect(plan.recommendedRouteId).toBe(plan.routes[0]?.id)
  })

  it('places checkpoints every interval and sums risk miles to the route length', () => {
    const plan = buildTripPlan(request({ intervalMiles: 50 }), now)
    for (const route of plan.routes) {
      const miles = route.checkpoints.map((c) => c.mile)
      expect(miles[1]).toBe(50)
      const total = Object.values(route.riskMiles).reduce((a, b) => a + b, 0)
      expect(total).toBeCloseTo(route.distanceMiles, 0)
    }
  })

  it('is deterministic for the same input', () => {
    expect(buildTripPlan(request(), now)).toEqual(buildTripPlan(request(), now))
  })
})
