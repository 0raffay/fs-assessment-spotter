import { describe, expect, it } from 'vitest'

import { heatmapSchema } from '@/features/forecast/types'
import { fixturePlan } from '@/tests/fixtures'

import { buildHeatmap } from '../heatmap'

describe('buildHeatmap', () => {
  const plan = fixturePlan()
  const heatmap = buildHeatmap(
    { bbox: plan.bbox, hours: 48, loadWeightLb: 42_000 },
    new Date('2026-11-11T22:20:00Z'),
  )

  it('satisfies the API contract', () => {
    expect(heatmapSchema.safeParse(heatmap).success).toBe(true)
    expect(heatmap.startsAt).toBe('2026-11-11T22:00:00.000Z')
  })

  it('covers the bbox in 0.5° cells with one level per hour and measure', () => {
    const [w, s, e, n] = plan.bbox
    expect(heatmap.cells).toHaveLength(((e - w) / 0.5) * ((n - s) / 0.5))
    for (const levels of Object.values(heatmap.cells[0]!.levels)) expect(levels).toHaveLength(49)
  })

  it('reports the worst overall risk of any cell for each hour', () => {
    heatmap.worstByHour.forEach((worst, hour) => {
      expect(worst).toBe(Math.max(...heatmap.cells.map((cell) => cell.levels.risk[hour]!)))
    })
  })
})
