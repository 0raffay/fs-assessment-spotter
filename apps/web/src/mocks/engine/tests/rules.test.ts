import { describe, expect, it } from 'vitest'

import { classify, conditionLevel } from '../rules'

describe('conditionLevel (PDF thresholds)', () => {
  it.each([
    [24.9, 'low'],
    [25, 'moderate'],
    [34.9, 'moderate'],
    [35, 'high'],
    [45, 'severe'],
    [54.9, 'severe'],
    [55, 'no_travel'],
  ] as const)('wind %d mph → %s', (mph, level) => {
    expect(conditionLevel('wind', mph)).toBe(level)
  })

  it.each([
    [0.09, 'low'],
    [0.1, 'moderate'],
    [0.25, 'high'],
    [0.5, 'severe'],
    [1.0, 'severe'],
    [1.01, 'no_travel'],
  ] as const)('rain %d in/hr → %s', (rate, level) => {
    expect(conditionLevel('rain', rate)).toBe(level)
  })

  it.each([
    [0.49, 'low'],
    [0.5, 'moderate'],
    [1.0, 'high'],
    [2.0, 'severe'],
    [3.0, 'severe'],
    [3.01, 'no_travel'],
  ] as const)('snow %d in/hr → %s', (rate, level) => {
    expect(conditionLevel('snow', rate)).toBe(level)
  })
})

describe('classify (load rules)', () => {
  const calm = { rain: 0, snow: 0 }

  it('makes 45–54 mph No Travel above 30,000 lb', () => {
    expect(classify({ ...calm, wind: 50 }, 30_001)).toMatchObject({
      level: 'no_travel',
      loadRuleApplied: true,
    })
    expect(classify({ ...calm, wind: 50 }, 30_000)).toMatchObject({
      level: 'severe',
      loadRuleApplied: false,
    })
  })

  it('makes 35–44 mph Severe above 40,000 lb', () => {
    expect(classify({ ...calm, wind: 40 }, 40_001)).toMatchObject({
      level: 'severe',
      loadRuleApplied: true,
    })
    expect(classify({ ...calm, wind: 40 }, 40_000)).toMatchObject({
      level: 'high',
      loadRuleApplied: false,
    })
  })

  it('takes the worst condition and names it', () => {
    expect(classify({ wind: 20, rain: 0.3, snow: 0 }, 10_000)).toMatchObject({
      level: 'high',
      decidedBy: 'rain',
    })
  })
})
