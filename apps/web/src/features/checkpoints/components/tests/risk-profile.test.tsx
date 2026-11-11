import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { RouteSelectionProvider, useRouteSelection } from '@/features/routes'
import { fixturePlan } from '@/tests/fixtures'
import { renderWithProviders } from '@/tests/render'

import { RiskProfile } from '../risk-profile'

const plan = fixturePlan()
const other = plan.routes.find((r) => r.id !== plan.recommendedRouteId)!

function Probe() {
  const { selectedRoute, selectedCheckpoint } = useRouteSelection()
  return (
    <output data-testid="probe">
      {selectedRoute.rank}:{selectedCheckpoint?.mile ?? 'none'}
    </output>
  )
}

function setup() {
  const onClose = vi.fn()
  const view = renderWithProviders(
    <RouteSelectionProvider plan={plan}>
      <RiskProfile onClose={onClose} />
      <Probe />
    </RouteSelectionProvider>,
  )
  return { ...view, onClose }
}

describe('RiskProfile', () => {
  it('draws one strip per route, with a segment per checkpoint', () => {
    setup()
    for (const route of plan.routes) {
      const strip = screen.getByRole('group', { name: `Route ${route.rank} risk by distance` })
      expect(strip.querySelectorAll('button')).toHaveLength(route.checkpoints.length)
    }
  })

  it('selects the route and checkpoint from a segment on another route', async () => {
    const { user } = setup()
    const checkpoint = other.checkpoints[3]!
    const name = new RegExp(`^Route ${other.rank}, mile ${checkpoint.mile}:`)
    await user.click(screen.getByRole('button', { name }))
    expect(screen.getByTestId('probe')).toHaveTextContent(`${other.rank}:${checkpoint.mile}`)
    expect(screen.getByText(`mi ${checkpoint.mile}`)).toBeInTheDocument()
  })

  it('selects a route from its label and closes', async () => {
    const { user, onClose } = setup()
    const label = screen.getByRole('button', { name: `Route ${other.rank}` })
    await user.click(label)
    expect(label).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Close risk profile' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('marks the recommended route', () => {
    setup()
    const recommended = plan.routes.find((r) => r.id === plan.recommendedRouteId)!
    expect(
      screen.getByRole('button', { name: `Route ${recommended.rank} Recommended` }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Recommended')).toHaveLength(1)
  })
})
