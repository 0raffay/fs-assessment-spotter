import { z } from 'zod'

/**
 * Domain model shared by every feature. Each schema is the runtime contract with the API, and each
 * type is inferred from its schema, so the two cannot drift. See docs/api-contract.md.
 */

// ---------------------------------------------------------------------------
// Generic schema builders
// ---------------------------------------------------------------------------

/** A zod object with exactly one property per key, all using the same value schema. */
export function recordSchema<
  const TKeys extends readonly [string, ...string[]],
  TValue extends z.ZodType,
>(keys: TKeys, value: TValue) {
  const shape = Object.fromEntries(keys.map((key) => [key, value])) as {
    [K in TKeys[number]]: TValue
  }
  return z.object(shape)
}

/** An ISO-8601 timestamp with a UTC offset, e.g. `2026-11-12T06:00:00-06:00`. */
export const isoDateTimeSchema = z.iso.datetime({ offset: true })
export type IsoDateTime = z.infer<typeof isoDateTimeSchema>

// ---------------------------------------------------------------------------
// Risk
// ---------------------------------------------------------------------------

/** Ordered from safest to most dangerous; the index is the numeric risk score. */
export const RISK_LEVELS = ['low', 'moderate', 'high', 'severe', 'no_travel'] as const
export const riskLevelSchema = z.enum(RISK_LEVELS)
export type RiskLevel = z.infer<typeof riskLevelSchema>

/** Compact numeric form of a risk level (0 = low … 4 = no_travel), used in large payloads. */
export const riskIndexSchema = z
  .number()
  .int()
  .min(0)
  .max(RISK_LEVELS.length - 1)
export type RiskIndex = 0 | 1 | 2 | 3 | 4

export const riskRecordSchema = <TValue extends z.ZodType>(value: TValue) =>
  recordSchema(RISK_LEVELS, value)
export type RiskRecord<TValue> = Readonly<Record<RiskLevel, TValue>>

// ---------------------------------------------------------------------------
// Weather
// ---------------------------------------------------------------------------

export const WEATHER_CONDITIONS = ['wind', 'rain', 'snow'] as const
export const weatherConditionSchema = z.enum(WEATHER_CONDITIONS)
export type WeatherCondition = z.infer<typeof weatherConditionSchema>

export const conditionRecordSchema = <TValue extends z.ZodType>(value: TValue) =>
  recordSchema(WEATHER_CONDITIONS, value)
export type ConditionRecord<TValue> = Readonly<Record<WeatherCondition, TValue>>

/** Wind in mph (sustained), rain and snow in inches per hour. */
export const weatherReadingSchema = conditionRecordSchema(z.number().nonnegative())
export type WeatherReading = z.infer<typeof weatherReadingSchema>

// ---------------------------------------------------------------------------
// Geography
// ---------------------------------------------------------------------------

/** `[longitude, latitude]`, the GeoJSON / MapLibre order. */
export const lngLatSchema = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)])
export type LngLat = z.infer<typeof lngLatSchema>

/** `[west, south, east, north]`. */
export const bboxSchema = z.tuple([z.number(), z.number(), z.number(), z.number()])
export type BBox = z.infer<typeof bboxSchema>

export const placeIdSchema = z.string().min(1).brand<'PlaceId'>()
export type PlaceId = z.infer<typeof placeIdSchema>

export const placeSchema = z.object({
  id: placeIdSchema,
  name: z.string().min(1),
  region: z.string(),
  coordinates: lngLatSchema,
  timeZone: z.string().min(1),
})
export type Place = z.infer<typeof placeSchema>

// ---------------------------------------------------------------------------
// Trip request
// ---------------------------------------------------------------------------

export const CHECKPOINT_INTERVALS = [10, 25, 50] as const
export const checkpointIntervalSchema = z.union([z.literal(10), z.literal(25), z.literal(50)])
export type CheckpointInterval = z.infer<typeof checkpointIntervalSchema>

export const MAX_LOAD_WEIGHT_LB = 80_000

export const tripRequestSchema = z.object({
  origin: placeSchema,
  destination: placeSchema,
  departureAt: isoDateTimeSchema,
  loadWeightLb: z.number().int().positive().max(MAX_LOAD_WEIGHT_LB),
  intervalMiles: checkpointIntervalSchema,
})
export type TripRequest = z.infer<typeof tripRequestSchema>

// ---------------------------------------------------------------------------
// Checkpoints
// ---------------------------------------------------------------------------

export const checkpointIdSchema = z.string().min(1).brand<'CheckpointId'>()
export type CheckpointId = z.infer<typeof checkpointIdSchema>

/** A forecast exists for the checkpoint's ETA, or the ETA is beyond the forecast range. */
export const checkpointForecastSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('available'),
    forecastHour: isoDateTimeSchema,
    weather: weatherReadingSchema,
    conditionLevels: conditionRecordSchema(riskLevelSchema),
    level: riskLevelSchema,
    decidedBy: weatherConditionSchema,
    loadRuleApplied: z.boolean(),
  }),
  z.object({ status: z.literal('unavailable') }),
])
export type CheckpointForecast = z.infer<typeof checkpointForecastSchema>
export type AvailableForecast = Extract<CheckpointForecast, { status: 'available' }>

export const checkpointSchema = z.object({
  id: checkpointIdSchema,
  index: z.number().int().nonnegative(),
  mile: z.number().nonnegative(),
  /** Miles of road this checkpoint stands for (to the next checkpoint). */
  segmentMiles: z.number().positive(),
  coordinates: lngLatSchema,
  locationLabel: z.string(),
  eta: isoDateTimeSchema,
  timeZone: z.string().min(1),
  forecast: checkpointForecastSchema,
})
export type Checkpoint = z.infer<typeof checkpointSchema>

// ---------------------------------------------------------------------------
// Routes and plan
// ---------------------------------------------------------------------------

export const routeIdSchema = z.string().min(1).brand<'RouteId'>()
export type RouteId = z.infer<typeof routeIdSchema>

export const routeSchema = z.object({
  id: routeIdSchema,
  /** 1 = recommended, ranked by the PDF's rules. */
  rank: z.number().int().min(1),
  name: z.string(),
  via: z.string(),
  distanceMiles: z.number().positive(),
  durationMinutes: z.number().int().positive(),
  departureAt: isoDateTimeSchema,
  arrivalAt: isoDateTimeSchema,
  geometry: z.array(lngLatSchema).min(2),
  checkpoints: z.array(checkpointSchema).min(1),
  riskMiles: riskRecordSchema(z.number().nonnegative()),
  averageRisk: z
    .number()
    .min(0)
    .max(RISK_LEVELS.length - 1),
  isRecommended: z.boolean(),
  isFastest: z.boolean(),
  /** True when the routing API returned fewer routes and this one was generated. */
  isGenerated: z.boolean(),
})
export type Route = z.infer<typeof routeSchema>

/** Why the recommended route won, as facts the UI can render without parsing sentences. */
export const reasonFactSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('fewest_miles'),
    level: riskLevelSchema,
    miles: z.number(),
    othersMiles: z.array(z.number()),
  }),
  z.object({
    kind: z.literal('lowest_average_risk'),
    value: z.number(),
    othersValues: z.array(z.number()),
  }),
  z.object({ kind: z.literal('shortest_time'), minutes: z.number().int() }),
  z.object({ kind: z.literal('time_vs_fastest'), deltaMinutes: z.number().int() }),
])
export type ReasonFact = z.infer<typeof reasonFactSchema>

export const tripPlanIdSchema = z.string().min(1).brand<'TripPlanId'>()
export type TripPlanId = z.infer<typeof tripPlanIdSchema>

export const tripPlanSchema = z.object({
  id: tripPlanIdSchema,
  request: tripRequestSchema,
  routes: z.array(routeSchema).min(1),
  recommendedRouteId: routeIdSchema,
  reasons: z.array(reasonFactSchema),
  /** Bounding box around all routes, used to request the heatmap. */
  bbox: bboxSchema,
  forecastIssuedAt: isoDateTimeSchema,
  generatedAt: isoDateTimeSchema,
})
export type TripPlan = z.infer<typeof tripPlanSchema>
