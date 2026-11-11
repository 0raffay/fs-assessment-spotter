import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/lib/api'
import { renderWithProviders } from '@/tests/render'

import { ForecastProvider } from '../../context/forecast-context'
import { ForecastDock } from '../forecast-dock'

const busy = new ApiError('http', 'Request failed with status 503', 503, {
  detail: 'Open-Meteo is busy right now (free-tier limit). Please try again in a minute.',
  code: 'provider_busy',
})

function setup(props: Partial<Parameters<typeof ForecastDock>[0]> = {}) {
  const onRetry = vi.fn()
  const view = renderWithProviders(
    <ForecastProvider initialHour={0} initiallyOpen>
      <ForecastDock
        heatmap={undefined}
        isLoading={false}
        departureAt="2026-11-12T12:00:00Z"
        arrivalAt="2026-11-13T02:00:00Z"
        timeZone="America/Chicago"
        compact={false}
        style={{}}
        onRetry={onRetry}
        {...props}
      />
    </ForecastProvider>,
  )
  return { ...view, onRetry }
}

describe('ForecastDock', () => {
  it('shows the loading chip while the heatmap is on its way', () => {
    setup({ isLoading: true })
    expect(screen.getByRole('button', { name: 'Loading forecast' })).toBeDisabled()
  })

  it('explains a failed heatmap and retries on request', async () => {
    const { user, onRetry } = setup({ error: busy })

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Forecast unavailable')
    expect(alert).toHaveTextContent('free-tier limit')

    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('goes back to loading while a retry is in flight', () => {
    setup({ error: busy, retrying: true })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Loading forecast' })).toBeInTheDocument()
  })
})
