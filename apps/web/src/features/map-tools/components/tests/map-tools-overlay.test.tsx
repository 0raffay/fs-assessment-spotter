import { screen } from '@testing-library/react'
import { MapProvider } from 'react-map-gl/maplibre'
import { describe, expect, it } from 'vitest'

import { RouteSelectionProvider } from '@/features/routes'
import { fixturePlan } from '@/tests/fixtures'
import { renderWithProviders } from '@/tests/render'

import { MapToolsProvider } from '../../context/map-tools-context'
import { useMapTools } from '../../context/map-tools-store'
import { MapToolsOverlay } from '../map-tools-overlay'

const PADDING = { top: 0, right: 0, bottom: 0, left: 0 }

function SettingsProbe() {
  const { heatmap, layers, basemap } = useMapTools()
  return <output data-testid="settings">{JSON.stringify({ heatmap, layers, basemap })}</output>
}

function settings(): {
  heatmap: { visible: boolean; measure: string; opacity: number }
  layers: Record<string, boolean>
  basemap: string
} {
  return JSON.parse(screen.getByTestId('settings').textContent ?? '{}') as ReturnType<
    typeof settings
  >
}

function setup({ compact = false, withPlan = true } = {}) {
  const overlay = (
    <MapToolsProvider>
      <MapToolsOverlay compact={compact} fitPadding={PADDING} />
      <SettingsProbe />
    </MapToolsProvider>
  )
  return renderWithProviders(
    <MapProvider>
      {withPlan ? (
        <RouteSelectionProvider plan={fixturePlan()}>{overlay}</RouteSelectionProvider>
      ) : (
        overlay
      )}
    </MapProvider>,
  )
}

describe('MapToolsOverlay', () => {
  it('disables the plan tools until a plan exists', () => {
    setup({ withPlan: false })
    expect(screen.getByRole('button', { name: 'Map layers' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Fit all routes' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeEnabled()
  })

  it('drops profile and zoom on compact layouts', () => {
    setup({ compact: true })
    expect(screen.queryByRole('button', { name: 'Risk profile' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Zoom in' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Checkpoint list' })).toBeInTheDocument()
  })

  it('toggles one panel at a time and closes on Escape', async () => {
    const { user } = setup()
    const layers = screen.getByRole('button', { name: 'Map layers' })
    await user.click(layers)
    expect(layers).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', { name: 'Map layers' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Legend' }))
    expect(layers).toHaveAttribute('aria-pressed', 'false')
    expect(await screen.findByRole('heading', { name: 'Legend' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Legend' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('updates heatmap, layer and basemap settings from the layers panel', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Map layers' }))

    await user.click(screen.getByRole('radio', { name: 'Wind' }))
    expect(settings().heatmap.measure).toBe('wind')

    await user.click(screen.getByRole('switch', { name: 'Alternate routes' }))
    expect(settings().layers.alternateRoutes).toBe(false)

    await user.click(screen.getByRole('radio', { name: 'Terrain' }))
    expect(settings().basemap).toBe('terrain')
    expect(screen.getByRole('radio', { name: 'Terrain' })).toHaveAttribute('aria-checked', 'true')

    await user.click(screen.getByRole('switch', { name: 'Weather heatmap' }))
    expect(settings().heatmap.visible).toBe(false)
    expect(screen.getByRole('radio', { name: 'Rain' })).toBeDisabled()
  })
})
