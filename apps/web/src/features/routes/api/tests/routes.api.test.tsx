import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'

import { createQueryClient } from '@/app/query-client'
import { fixtureRequest } from '@/tests/fixtures'

import { useTripPlan } from '../routes.api'

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>
}

describe('useTripPlan', () => {
  it('stays idle without a request', () => {
    const { result } = renderHook(() => useTripPlan(null), { wrapper })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('returns a validated plan for a request', async () => {
    const { result } = renderHook(() => useTripPlan(fixtureRequest()), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.routes).toHaveLength(3)
    expect(result.current.data?.recommendedRouteId).toBe(result.current.data?.routes[0]?.id)
  })

  it('surfaces API errors as ApiError', async () => {
    const request = fixtureRequest()
    const { result } = renderHook(() => useTripPlan({ ...request, destination: request.origin }), {
      wrapper,
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toMatchObject({
      kind: 'http',
      status: 400,
      userMessage: 'Origin and destination must be different places.',
    })
  })
})
