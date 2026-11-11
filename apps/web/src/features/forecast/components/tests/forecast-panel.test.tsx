import { act, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildHeatmap } from '@/mocks/engine/heatmap'
import { renderWithProviders } from '@/tests/render'
import { fixturePlan } from '@/tests/fixtures'

import { ForecastProvider } from '../../context/forecast-context'
import { useForecast } from '../../context/forecast-store'
import { ForecastPanel } from '../forecast-panel'

const plan = fixturePlan()
const heatmap = buildHeatmap(
  { bbox: plan.bbox, hours: 48, loadWeightLb: 42_000 },
  new Date('2026-11-11T22:20:00Z'),
)
const route = plan.routes[0]!

function OpenProbe() {
  const { isOpen } = useForecast()
  return <output data-testid="open">{String(isOpen)}</output>
}

function setup(initialHour = 14) {
  return renderWithProviders(
    <ForecastProvider initialHour={initialHour} initiallyOpen>
      <ForecastPanel
        heatmap={heatmap}
        departureAt={route.departureAt}
        arrivalAt={route.arrivalAt}
        timeZone="America/Chicago"
      />
      <OpenProbe />
    </ForecastProvider>,
  )
}

describe('ForecastPanel', () => {
  afterEach(() => vi.useRealTimers())

  it('shows the hour and labels the slider for screen readers', () => {
    setup()
    expect(screen.getByText('+14h')).toBeInTheDocument()
    expect(screen.getByText('Thu 06:00')).toBeInTheDocument()
    const slider = screen.getByRole('slider', { name: 'Heatmap forecast hour' })
    expect(slider).toHaveAttribute('aria-valuenow', '14')
    expect(slider).toHaveAttribute('aria-valuetext', 'plus 14 hours, Thu 06:00')
  })

  it('steps hours, clamps at 0 and closes', async () => {
    const { user } = setup(1)
    await user.click(screen.getByRole('button', { name: 'Next hour' }))
    expect(screen.getByText('+2h')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Previous hour' }))
    await user.click(screen.getByRole('button', { name: 'Previous hour' }))
    expect(screen.getByText('+0h')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous hour' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Close forecast' }))
    expect(screen.getByTestId('open')).toHaveTextContent('false')
  })

  it('plays forward one hour every 600ms and stops at +48h', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    setup(46)
    act(() => screen.getByRole('button', { name: 'Play forecast' }).click())
    await act(() => vi.advanceTimersByTimeAsync(600 * 4))
    expect(screen.getByText('+48h')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play forecast' })).toBeInTheDocument()
  })
})
