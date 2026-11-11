import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/tests/render'

import { AppShell } from '../app-shell'

describe('AppShell', () => {
  it('shows the brand, status and map frame content', () => {
    renderWithProviders(
      <AppShell
        canShare={false}
        status={{ tone: 'ok', label: 'Forecast updated 10:00' }}
        headerStart={<span>Trip chip</span>}
      >
        <p>map content</p>
      </AppShell>,
    )

    expect(screen.getByText('SkyRig')).toBeInTheDocument()
    expect(screen.getByText('Trip chip')).toBeInTheDocument()
    expect(screen.getByRole('main', { name: 'Trip map' })).toHaveTextContent('map content')
    expect(screen.getByRole('status')).toHaveTextContent('Forecast updated 10:00')
  })

  it('disables Share until there is a trip, then copies the link', async () => {
    const { rerender, user } = renderWithProviders(
      <AppShell canShare={false}>
        <div />
      </AppShell>,
    )
    expect(screen.getByRole('button', { name: /share/i })).toBeDisabled()

    rerender(
      <AppShell canShare>
        <div />
      </AppShell>,
    )
    await user.click(screen.getByRole('button', { name: /share/i }))
    expect(await navigator.clipboard.readText()).toBe(window.location.href)
    expect(await screen.findByText('Link copied')).toBeInTheDocument()

    // The button itself confirms the copy, then returns to "Share".
    const copied = screen.getByRole('button', { name: 'Copied' })
    expect(copied).toHaveAttribute('data-state', 'copied')
    await waitFor(
      () =>
        expect(screen.getByRole('button', { name: 'Share' })).toHaveAttribute('data-state', 'idle'),
      { timeout: 3000 },
    )
  })

  it('toggles the theme', async () => {
    const { user } = renderWithProviders(
      <AppShell canShare={false}>
        <div />
      </AppShell>,
    )
    await user.click(screen.getByRole('button', { name: 'Switch to light theme' }))
    await waitFor(() => expect(document.documentElement).toHaveClass('light'))
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument()
  })

  it('explains the risk rules in the help dialog', async () => {
    const { user } = renderWithProviders(
      <AppShell canShare={false}>
        <div />
      </AppShell>,
    )
    await user.click(screen.getByRole('button', { name: 'How risk is calculated' }))
    expect(
      await screen.findByRole('dialog', { name: 'How SkyRig rates a route' }),
    ).toHaveTextContent('45–54 mph with more than 30,000 lb is No Travel')
  })
})
