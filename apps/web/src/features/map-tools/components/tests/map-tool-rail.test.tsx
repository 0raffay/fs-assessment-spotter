import { screen } from '@testing-library/react'
import { MapProvider } from 'react-map-gl/maplibre'
import { describe, expect, it } from 'vitest'

import { ForecastProvider } from '@/features/forecast'
import { RouteSelectionProvider } from '@/features/routes'
import { fixturePlan } from '@/tests/fixtures'
import { renderWithProviders } from '@/tests/render'

import { MapToolsProvider } from '../../context/map-tools-context'
import { MapToolRail } from '../map-tool-rail'

const PADDING = { top: 0, right: 0, bottom: 0, left: 0 }

function setup() {
  return renderWithProviders(
    <MapProvider>
      <RouteSelectionProvider plan={fixturePlan()}>
        <ForecastProvider initialHour={0} initiallyOpen>
          <MapToolsProvider>
            <MapToolRail compact={false} fitPadding={PADDING} />
          </MapToolsProvider>
        </ForecastProvider>
      </RouteSelectionProvider>
    </MapProvider>,
  )
}

describe('MapToolRail', () => {
  it('lets the forecast and the risk profile take turns in the bottom dock', async () => {
    const { user } = setup()
    const forecast = screen.getByRole('button', { name: 'Forecast timeline' })
    const profile = screen.getByRole('button', { name: 'Risk profile' })
    expect(forecast).toHaveAttribute('aria-pressed', 'true')
    expect(profile).toHaveAttribute('aria-pressed', 'false')

    await user.click(profile)
    expect(profile).toHaveAttribute('aria-pressed', 'true')
    expect(forecast).toHaveAttribute('aria-pressed', 'false')

    await user.click(forecast)
    expect(forecast).toHaveAttribute('aria-pressed', 'true')
    expect(profile).toHaveAttribute('aria-pressed', 'false')
  })

  it('keeps side panels independent of the bottom dock', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Risk profile' }))
    await user.click(screen.getByRole('button', { name: 'Checkpoint list' }))
    expect(screen.getByRole('button', { name: 'Checkpoint list' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Risk profile' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})
