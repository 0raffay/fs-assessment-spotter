import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/tests/render'
import { fixturePlan } from '@/tests/fixtures'
import type { Checkpoint } from '@/types'

import { CheckpointCard } from '../checkpoint-card'

function setup(checkpoint: Checkpoint) {
  const handlers = { onPrevious: vi.fn(), onNext: vi.fn(), onClose: vi.fn() }
  const utils = renderWithProviders(
    <CheckpointCard
      checkpoint={checkpoint}
      total={40}
      routeMiles={960}
      loadWeightLb={42_000}
      {...handlers}
    />,
  )
  return { ...utils, handlers }
}

describe('CheckpointCard', () => {
  const route = fixturePlan().routes[0]!
  const available = route.checkpoints.find((c) => c.forecast.status === 'available' && c.index > 0)!

  it('shows the ETA, mile, each condition and what decided the level', () => {
    setup(available)
    if (available.forecast.status !== 'available') throw new Error('fixture')

    expect(
      screen.getByRole('article', { name: `Checkpoint ${available.index + 1} details` }),
    ).toBeInTheDocument()
    expect(screen.getByText(`${available.index + 1} of 40`)).toBeInTheDocument()
    for (const condition of ['Wind', 'Rain', 'Snow']) {
      expect(screen.getAllByText(condition).length).toBeGreaterThan(0)
    }
    expect(screen.getAllByText(/^(mph|in\/hr)$/)).toHaveLength(3)
    expect(screen.getByText(/decides this checkpoint’s level/)).toBeInTheDocument()
    expect(screen.getByText(/42,000 lb load/)).toBeInTheDocument()
  })

  it('wires previous, next and close', async () => {
    const { user, handlers } = setup(available)
    await user.click(screen.getByRole('button', { name: 'Previous checkpoint' }))
    await user.click(screen.getByRole('button', { name: 'Next checkpoint' }))
    await user.click(screen.getByRole('button', { name: 'Close checkpoint' }))
    expect(handlers.onPrevious).toHaveBeenCalledOnce()
    expect(handlers.onNext).toHaveBeenCalledOnce()
    expect(handlers.onClose).toHaveBeenCalledOnce()
  })

  it('explains a checkpoint beyond the forecast range', () => {
    setup({ ...available, forecast: { status: 'unavailable' } })
    expect(screen.getByText('No forecast')).toBeInTheDocument()
    expect(screen.getByText(/after the forecast range ends/)).toBeInTheDocument()
  })
})
