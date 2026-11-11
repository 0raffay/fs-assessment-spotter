import { describe, expect, it } from 'vitest'

import { findPlace } from '@/mocks/engine/places'
import type { Place } from '@/types'

import { toTripRequest, tripFormSchema, type TripFormInput } from '..'

const dallas = findPlace('place:dallas-tx') as Place
const denver = findPlace('place:denver-co') as Place

function values(overrides: Partial<TripFormInput> = {}): TripFormInput {
  return {
    origin: dallas,
    destination: denver,
    date: '2099-01-10',
    time: '06:00',
    loadWeightLb: 42_000,
    intervalMiles: 25,
    ...overrides,
  }
}

function errorsOf(input: TripFormInput) {
  const result = tripFormSchema.safeParse(input)
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((issue) => [issue.path.join('.'), issue.message]))
}

describe('tripFormSchema', () => {
  it('accepts a complete trip and converts it to a request in the origin’s zone', () => {
    const parsed = tripFormSchema.parse(values())
    expect(toTripRequest(parsed)).toMatchObject({
      departureAt: '2099-01-10T12:00:00.000Z',
      loadWeightLb: 42_000,
      intervalMiles: 25,
    })
  })

  it('requires both places and a load', () => {
    expect(errorsOf(values({ origin: null, destination: null, loadWeightLb: null }))).toEqual({
      origin: 'Choose where the trip starts',
      destination: 'Choose where the trip ends',
      loadWeightLb: 'Enter the load weight',
    })
  })

  it('rejects the same origin and destination', () => {
    expect(errorsOf(values({ destination: dallas }))).toEqual({
      destination: 'Destination must differ from the origin',
    })
  })

  it('rejects departures in the past and loads over 80,000 lb', () => {
    expect(errorsOf(values({ date: '2020-01-01' }))).toEqual({ time: 'Departure is in the past' })
    expect(errorsOf(values({ loadWeightLb: 90_000 }))).toEqual({
      loadWeightLb: 'Load can’t be more than 80,000 lb',
    })
  })
})
