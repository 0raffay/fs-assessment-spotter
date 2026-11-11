import { findPlace } from '@/mocks/engine/places'
import { buildTripPlan } from '@/mocks/engine/trip'
import type { Place, TripPlan, TripRequest } from '@/types'

function place(id: string): Place {
  const found = findPlace(id)
  if (!found) throw new Error(`Unknown fixture place ${id}`)
  return found
}

/** Dallas → Denver, 42,000 lb, every 25 mi, departing in the far future (always "upcoming"). */
export function fixtureRequest(overrides: Partial<TripRequest> = {}): TripRequest {
  return {
    origin: place('place:dallas-tx'),
    destination: place('place:denver-co'),
    departureAt: '2099-01-10T12:00:00.000Z',
    loadWeightLb: 42_000,
    intervalMiles: 25,
    ...overrides,
  }
}

/** A deterministic plan, built by the same engine the mocks use. */
export function fixturePlan(overrides: Partial<TripRequest> = {}): TripPlan {
  const request = fixtureRequest({ departureAt: '2026-11-12T12:00:00.000Z', ...overrides })
  return buildTripPlan(request, new Date('2026-11-11T22:20:00Z'))
}
