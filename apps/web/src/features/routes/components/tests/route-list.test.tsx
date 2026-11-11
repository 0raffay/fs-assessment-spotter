import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/tests/render'
import { fixturePlan } from '@/tests/fixtures'

import { RouteSelectionProvider } from '../../context/route-selection-context'
import { RouteList } from '../route-list'

describe('RouteList', () => {
  const plan = fixturePlan()

  function setup(variant: 'full' | 'peek' = 'full') {
    return renderWithProviders(
      <RouteSelectionProvider plan={plan}>
        <RouteList variant={variant} />
      </RouteSelectionProvider>,
    )
  }

  it('shows the three ranked routes with the recommendation selected', () => {
    setup()
    const cards = screen
      .getAllByRole('button', { pressed: undefined })
      .filter((b) => b.hasAttribute('aria-pressed'))
    expect(cards).toHaveLength(3)

    const recommended = cards[0]!
    expect(recommended).toHaveAttribute('aria-pressed', 'true')
    expect(within(recommended).getByText('Recommended')).toBeInTheDocument()
    expect(within(recommended).getByLabelText('Why this route')).toBeInTheDocument()
    expect(within(recommended).getByText(plan.routes[0]!.name)).toBeInTheDocument()
  })

  it('selects another route on click', async () => {
    const { user } = setup()
    const second = screen.getByRole('button', { name: new RegExp(plan.routes[1]!.via) })
    await user.click(second)
    expect(second).toHaveAttribute('aria-pressed', 'true')
  })

  it('peek shows only the selected route', () => {
    setup('peek')
    expect(
      screen.getAllByRole('button').filter((b) => b.hasAttribute('aria-pressed')),
    ).toHaveLength(1)
    expect(screen.getByText('2 more routes · drag up to compare')).toBeInTheDocument()
  })
})
