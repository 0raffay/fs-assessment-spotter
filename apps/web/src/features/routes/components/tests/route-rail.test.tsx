import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { fixturePlan } from '@/tests/fixtures'
import { renderWithProviders } from '@/tests/render'

import { RouteSelectionProvider } from '../../context/route-selection-context'
import { RouteRail } from '../route-rail'

const plan = fixturePlan()

describe('RouteRail', () => {
  it('renders nothing without a plan', () => {
    renderWithProviders(<RouteRail />)
    expect(screen.queryByRole('group', { name: 'Routes' })).not.toBeInTheDocument()
  })

  it('lists the routes, marks the recommended one and switches the selection', async () => {
    const { user } = renderWithProviders(
      <RouteSelectionProvider plan={plan}>
        <RouteRail />
      </RouteSelectionProvider>,
    )
    const group = screen.getByRole('group', { name: 'Routes' })
    const buttons = within(group).getAllByRole('button')
    expect(buttons).toHaveLength(plan.routes.length)

    const recommended = buttons.find((b) => /recommended/.test(b.getAttribute('aria-label') ?? ''))
    expect(recommended).toHaveAttribute('aria-pressed', 'true')
    // In dark mode the shadcn ghost hover (`dark:hover:bg-muted/50`) used to replace the selected
    // fill on hover, hiding the dark number; ours must win the merge.
    expect(recommended?.className).toContain('dark:hover:bg-primary')
    expect(recommended?.className).not.toContain('dark:hover:bg-muted')

    const other = buttons.find((b) => b !== recommended)!
    await user.click(other)
    expect(other).toHaveAttribute('aria-pressed', 'true')
    expect(recommended).toHaveAttribute('aria-pressed', 'false')
  })
})
