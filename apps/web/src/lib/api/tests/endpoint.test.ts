import { http, HttpResponse } from 'msw'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { z } from 'zod'

import { mockEndpoint } from '@/mocks/mock-endpoint'
import { server } from '@/mocks/server'

import { ApiError, callEndpoint, createQueryKeys, defineEndpoint, type EndpointResponse } from '..'

const echoEndpoint = defineEndpoint({
  method: 'POST',
  path: '/test/echo/',
  query: z.object({ times: z.coerce.number().int().positive() }),
  body: z.object({ word: z.string().min(1) }),
  response: z.object({ words: z.array(z.string()) }),
})

const pingEndpoint = defineEndpoint({
  method: 'GET',
  path: '/test/ping/',
  response: z.object({ ok: z.literal(true) }),
})

describe('callEndpoint', () => {
  it('sends query and body, and returns the parsed response', async () => {
    server.use(
      mockEndpoint(echoEndpoint, ({ query, body }) => ({
        words: Array.from({ length: query.times }, () => body.word),
      })),
    )

    const result = await callEndpoint(echoEndpoint, { query: { times: 3 }, body: { word: 'hi' } })

    expect(result.words).toEqual(['hi', 'hi', 'hi'])
    expectTypeOf(result).toEqualTypeOf<EndpointResponse<typeof echoEndpoint>>()
  })

  it('rejects an invalid request before it reaches the network', async () => {
    await expect(
      callEndpoint(echoEndpoint, { query: { times: 1 }, body: { word: '' } }),
    ).rejects.toMatchObject({ kind: 'invalid_request' })
  })

  it('rejects a response that breaks the schema', async () => {
    server.use(http.get('/api/test/ping/', () => HttpResponse.json({ ok: 'yes' })))
    await expect(callEndpoint(pingEndpoint, {})).rejects.toMatchObject({ kind: 'invalid_response' })
  })

  it('turns HTTP errors into ApiError with the server detail', async () => {
    server.use(
      http.get('/api/test/ping/', () => HttpResponse.json({ detail: 'Nope' }, { status: 503 })),
    )

    const error = await callEndpoint(pingEndpoint, {}).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: 'http', status: 503, userMessage: 'Nope' })
  })

  it('reports network failures as kind "network"', async () => {
    server.use(http.get('/api/test/ping/', () => HttpResponse.error()))
    await expect(callEndpoint(pingEndpoint, {})).rejects.toMatchObject({ kind: 'network' })
  })
})

describe('mockEndpoint', () => {
  it('answers 400 with field errors when the body is invalid', async () => {
    server.use(mockEndpoint(echoEndpoint, () => ({ words: [] })))
    const response = await fetch('/api/test/echo/?times=1', {
      method: 'POST',
      body: JSON.stringify({ word: 5 }),
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ fieldErrors: { word: [expect.any(String)] } })
  })
})

describe('createQueryKeys', () => {
  it('prefixes every key with the scope', () => {
    const keys = createQueryKeys('routes')
    expect(keys.all).toEqual(['routes'])
    expect(keys.of('plan', 42)).toEqual(['routes', 'plan', 42])
    expectTypeOf(keys.of('plan', 42)).toEqualTypeOf<readonly ['routes', 'plan', 42]>()
  })
})
