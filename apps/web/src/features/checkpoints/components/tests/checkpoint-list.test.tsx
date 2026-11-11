import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { RouteSelectionProvider, useRouteSelection } from '@/features/routes'
import { fixturePlan } from '@/tests/fixtures'
import { renderWithProviders } from '@/tests/render'

import { countByFilter } from '../../lib/checkpoints'
import { CheckpointList } from '../checkpoint-list'

const plan = fixturePlan()
const route = plan.routes.find((r) => r.id === plan.recommendedRouteId)!
const counts = countByFilter(route.checkpoints)

function SelectedProbe() {
  const { selectedCheckpoint } = useRouteSelection()
  return <output data-testid="selected">{selectedCheckpoint?.mile ?? 'none'}</output>
}

function setup() {
  const onClose = vi.fn()
  const onPicked = vi.fn()
  const view = renderWithProviders(
    <RouteSelectionProvider plan={plan}>
      <CheckpointList onClose={onClose} onPicked={onPicked} />
      <SelectedProbe />
    </RouteSelectionProvider>,
  )
  return { ...view, onClose, onPicked }
}

function rows() {
  return within(screen.getByRole('list', { name: /Checkpoints on route/ })).getAllByRole('button')
}

describe('CheckpointList', () => {
  it('lists every checkpoint of the selected route with its summary', () => {
    setup()
    expect(
      screen.getByText(`Route ${route.rank} · ${counts.all} stops, every 25 mi`),
    ).toBeInTheDocument()
    expect(rows()).toHaveLength(counts.all)
    expect(rows()[0]).toHaveTextContent('mi 0')
  })

  it('filters by risk level', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('radio', { name: /Moderate\+/ }))
    expect(rows()).toHaveLength(counts.moderate)
    await user.click(screen.getByRole('radio', { name: /High\+/ }))
    if (counts.high === 0) {
      expect(screen.getByText(/No checkpoints at High or above/)).toBeInTheDocument()
    } else {
      expect(rows()).toHaveLength(counts.high)
    }
  })

  it('selects a checkpoint, marks the row current and reports the pick', async () => {
    const { user, onPicked, onClose } = setup()
    const target = route.checkpoints[2]!
    await user.click(rows()[2]!)
    expect(screen.getByTestId('selected')).toHaveTextContent(String(target.mile))
    expect(rows()[2]).toHaveAttribute('aria-current', 'true')
    expect(onPicked).toHaveBeenCalledExactlyOnceWith(target.id)

    await user.click(screen.getByRole('button', { name: 'Close checkpoints' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
