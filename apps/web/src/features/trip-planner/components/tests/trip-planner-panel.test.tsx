import { screen, waitFor, within } from '@testing-library/react'
import { useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'

import { searchParamCodec } from '@/hooks/use-search-param-state'
import { findPlace } from '@/mocks/engine/places'
import { renderWithProviders } from '@/tests/render'
import type { TripRequest } from '@/types'

import { TripPlannerProvider } from '../../context/trip-planner-context'
import { TRIP_PARAM } from '../../context/trip-planner-store'
import { TripPlannerPanel } from '../trip-planner-panel'

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.search}</output>
}

function setup(route = '/') {
  return renderWithProviders(
    <TripPlannerProvider>
      <TripPlannerPanel results={<p>results slot</p>} />
      <LocationProbe />
    </TripPlannerProvider>,
    { route },
  )
}

describe('TripPlannerPanel', () => {
  it('plans a trip: search places, fill the form, and store the trip in the URL', async () => {
    const { user } = setup()

    await user.type(screen.getByRole('combobox', { name: 'From' }), 'Dall')
    await user.click(await screen.findByRole('option', { name: /Dallas/ }))
    await user.type(screen.getByRole('combobox', { name: 'To' }), 'Denv')
    await user.click(await screen.findByRole('option', { name: /Denver/ }))
    await user.type(screen.getByLabelText('Load weight'), '42000')
    await user.click(screen.getByRole('radio', { name: '50 mi' }))
    await user.click(screen.getByRole('button', { name: /plan routes/i }))

    expect(await screen.findByText('results slot')).toBeInTheDocument()
    const settings = screen.getByRole('list', { name: 'Trip settings' })
    expect(within(settings).getByText('42,000 lb')).toBeInTheDocument()
    expect(within(settings).getByText('Every 50 mi')).toBeInTheDocument()

    const raw =
      new URLSearchParams(screen.getByTestId('location').textContent ?? '').get(TRIP_PARAM) ?? ''
    expect(searchParamCodec.decode(raw)).toMatchObject({
      origin: { name: 'Dallas' },
      destination: { name: 'Denver' },
      intervalMiles: 50,
    })
  })

  it('shows validation errors instead of submitting', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /plan routes/i }))

    expect(await screen.findByText('Choose where the trip starts')).toBeInTheDocument()
    expect(screen.getByText('Enter the load weight')).toBeInTheDocument()
    expect(screen.queryByText('results slot')).not.toBeInTheDocument()
  })

  it('restores a shared trip from the URL and lets you edit it', async () => {
    const request: TripRequest = {
      origin: findPlace('place:dallas-tx')!,
      destination: findPlace('place:denver-co')!,
      departureAt: '2099-01-10T12:00:00.000Z',
      loadWeightLb: 30_000,
      intervalMiles: 10,
    }
    const { user } = setup(`/?${TRIP_PARAM}=${searchParamCodec.encode(request)}`)

    expect(screen.getByText('Dallas, TX')).toBeInTheDocument()
    expect(screen.getByText('30,000 lb')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'From' })).toHaveValue('Dallas, TX'),
    )
    expect(screen.getByRole('radio', { name: '10 mi' })).toHaveAttribute('aria-checked', 'true')
  })
})
