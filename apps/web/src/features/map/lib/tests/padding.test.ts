import { describe, expect, it } from 'vitest'

import { clampPadding } from '../padding'

const padding = { top: 64, right: 408, bottom: 310, left: 416 }

describe('clampPadding', () => {
  it('keeps padding that leaves enough clear map', () => {
    expect(clampPadding(padding, 1440, 900)).toEqual(padding)
  })

  it('shrinks opposite sides proportionally on a narrow map', () => {
    const clamped = clampPadding(padding, 900, 500, 160)
    expect(clamped.left + clamped.right).toBeLessThanOrEqual(900 - 160)
    expect(clamped.left / clamped.right).toBeCloseTo(416 / 408, 1)
    expect(clamped.top + clamped.bottom).toBeLessThanOrEqual(500 - 160)
  })

  it('collapses to zero when the map is smaller than the clear minimum', () => {
    expect(clampPadding(padding, 100, 100, 160)).toEqual({ top: 0, right: 0, bottom: 0, left: 0 })
  })
})
