import { render, type RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'

import { AppProviders } from '@/app/providers'

interface Options extends Omit<RenderOptions, 'wrapper'> {
  /** Initial URL for components that read search params. */
  route?: string
}

/** Renders inside the real app providers (query client, theme, tooltips, toaster) and a router. */
export function renderWithProviders(ui: ReactElement, { route = '/', ...options }: Options = {}) {
  const user = userEvent.setup()
  const result = render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[route]}>
        <AppProviders>{children}</AppProviders>
      </MemoryRouter>
    ),
    ...options,
  })
  return { user, ...result }
}
