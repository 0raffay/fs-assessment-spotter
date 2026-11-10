import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'

import { ApiError, api } from '..'

describe('api agent', () => {
  it('returns response data on success', async () => {
    const response = await api.get('/health/', {
      adapter: async (config) => ({
        data: { status: 'ok' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }),
    })

    expect(response.data).toEqual({ status: 'ok' })
  })

  it('converts HTTP errors to ApiError', async () => {
    const request = api.get('/health/', {
      adapter: async (config) => {
        const response = {
          data: { detail: 'boom' },
          status: 500,
          statusText: 'Server Error',
          headers: {},
          config,
        }
        throw new AxiosError('Server Error', 'ERR_BAD_RESPONSE', config, null, response)
      },
    })

    await expect(request).rejects.toBeInstanceOf(ApiError)
    await expect(request).rejects.toMatchObject({ status: 500, data: { detail: 'boom' } })
  })
})
