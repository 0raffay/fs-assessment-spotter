/**
 * MOCK ONLY: a frontend copy of the PDF's risk rules so mocked data behaves like the real backend.
 * The Django `risk` app is the source of truth; delete this with the mocks.
 */
import {
  WEATHER_CONDITIONS,
  type ConditionRecord,
  type RiskLevel,
  type WeatherCondition,
  type WeatherReading,
} from '@/types'

import { maxRisk, riskFromIndex, riskIndex } from '@/lib/risk'

type Bands = readonly [moderate: number, high: number, severe: number, noTravel: number]

/** Lower bound of each band; a value on a bound belongs to the higher band (`>`) except where noted. */
const BANDS: ConditionRecord<Bands> = {
  wind: [25, 35, 45, 55],
  rain: [0.1, 0.25, 0.5, 1.0],
  snow: [0.5, 1.0, 2.0, 3.0],
}

export function conditionLevel(condition: WeatherCondition, value: number): RiskLevel {
  const [moderate, high, severe, noTravel] = BANDS[condition]
  // Wind: ≥55 is No Travel. Rain/snow: the PDF says ">1.00" / ">3.0", so the top bound is exclusive.
  const isNoTravel = condition === 'wind' ? value >= noTravel : value > noTravel
  if (isNoTravel) return 'no_travel'
  if (value >= severe) return 'severe'
  if (value >= high) return 'high'
  if (value >= moderate) return 'moderate'
  return 'low'
}

export interface Classification {
  conditionLevels: ConditionRecord<RiskLevel>
  level: RiskLevel
  decidedBy: WeatherCondition
  loadRuleApplied: boolean
}

export function classify(weather: WeatherReading, loadWeightLb: number): Classification {
  const base = {
    wind: conditionLevel('wind', weather.wind),
    rain: conditionLevel('rain', weather.rain),
    snow: conditionLevel('snow', weather.snow),
  }
  let wind = base.wind
  if (weather.wind >= 45 && weather.wind < 55 && loadWeightLb > 30_000) wind = 'no_travel'
  else if (weather.wind >= 35 && weather.wind < 45 && loadWeightLb > 40_000)
    wind = riskFromIndex(Math.max(riskIndex(wind), riskIndex('severe')))
  const conditionLevels: ConditionRecord<RiskLevel> = { ...base, wind }
  const level = maxRisk(Object.values(conditionLevels))
  const decidedBy =
    WEATHER_CONDITIONS.find((condition) => conditionLevels[condition] === level) ?? 'wind'
  return { conditionLevels, level, decidedBy, loadRuleApplied: wind !== base.wind }
}
