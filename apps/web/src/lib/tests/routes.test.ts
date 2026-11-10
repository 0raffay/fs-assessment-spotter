import { describe, expect, it } from 'vitest'

import { ROUTES, withSearch } from '../routes'

describe('withSearch', () => {
  it('returns the bare path without params', () => {
    expect(withSearch('/plan')).toBe('/plan')
  })

  it('appends params and skips empty values', () => {
    expect(withSearch('/plan', { from: 'Dallas', to: '', weight: 30000, x: undefined })).toBe(
      '/plan?from=Dallas&weight=30000',
    )
  })
})

describe('ROUTES', () => {
  it('gives the path pattern when called without arguments', () => {
    expect(ROUTES.routePlanner()).toBe('/')
  })

  it('builds a URL with search params', () => {
    expect(ROUTES.routePlanner({ from: 'Dallas, TX' })).toBe('/?from=Dallas%2C+TX')
  })
})
