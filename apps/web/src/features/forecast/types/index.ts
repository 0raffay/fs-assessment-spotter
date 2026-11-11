import { z } from 'zod'

import { bboxSchema, isoDateTimeSchema, recordSchema, riskIndexSchema } from '@/types'

/** What the heatmap colors: overall (load-adjusted) risk, or one condition's own level. */
export const HEATMAP_MEASURES = ['risk', 'wind', 'rain', 'snow'] as const
export const heatmapMeasureSchema = z.enum(HEATMAP_MEASURES)
export type HeatmapMeasure = z.infer<typeof heatmapMeasureSchema>

/** Forecast hours the slider covers: 0 (now) … 48. */
export const FORECAST_HOURS = 48

export const heatmapQuerySchema = z.object({
  west: z.coerce.number().min(-180).max(180),
  south: z.coerce.number().min(-90).max(90),
  east: z.coerce.number().min(-180).max(180),
  north: z.coerce.number().min(-90).max(90),
  hours: z.coerce.number().int().min(1).max(FORECAST_HOURS).default(FORECAST_HOURS),
  loadWeightLb: z.coerce.number().int().positive(),
})
export type HeatmapQuery = z.input<typeof heatmapQuerySchema>

export const heatmapCellSchema = z.object({
  id: z.string(),
  bounds: bboxSchema,
  /** One RiskIndex per hour (length = hours + 1), per measure. */
  levels: recordSchema(HEATMAP_MEASURES, z.array(riskIndexSchema)),
})
export type HeatmapCell = z.infer<typeof heatmapCellSchema>

export const heatmapSchema = z
  .object({
    bbox: bboxSchema,
    cellSizeDegrees: z.number().positive(),
    startsAt: isoDateTimeSchema,
    hours: z.number().int().min(1).max(FORECAST_HOURS),
    cells: z.array(heatmapCellSchema),
    worstByHour: z.array(riskIndexSchema),
  })
  .refine((h) => h.worstByHour.length === h.hours + 1, {
    message: 'worstByHour must have hours + 1 entries',
  })
export type Heatmap = z.infer<typeof heatmapSchema>

export interface ForecastState {
  /** Hours after `startsAt` the heatmap shows. */
  hour: number
  setHour: (hour: number) => void
  step: (delta: number) => void
  isPlaying: boolean
  togglePlay: () => void
  isOpen: boolean
  setOpen: (open: boolean) => void
}
