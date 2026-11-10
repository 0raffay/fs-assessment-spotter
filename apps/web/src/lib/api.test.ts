import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, apiGet } from './api'

describe('apiGet', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns parsed JSON on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ status: 'ok' }))
    await expect(apiGet('/health/')).resolves.toEqual({ status: 'ok' })
  })

  it('throws ApiError on a non-2xx response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ detail: 'x' }, { status: 500 }))
    await expect(apiGet('/health/')).rejects.toBeInstanceOf(ApiError)
  })
})
