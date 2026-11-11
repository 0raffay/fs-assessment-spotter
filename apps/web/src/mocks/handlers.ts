import type { HttpHandler } from 'msw'

/**
 * Every mocked endpoint. Each feature exports its own handlers from `api/<feature>.mock.ts`;
 * add them here. Turning mocks off (VITE_ENABLE_MOCKS=false) makes the app use the real API.
 */
export const handlers: HttpHandler[] = []
