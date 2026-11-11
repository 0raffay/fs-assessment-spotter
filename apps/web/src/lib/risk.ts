import {
  RISK_LEVELS,
  type RiskIndex,
  type RiskLevel,
  type RiskRecord,
  type WeatherCondition,
} from '@/types'

export interface RiskMeta {
  label: string
  /** Tailwind classes, written out in full so Tailwind can see them. */
  textClass: string
  bgClass: string
  softBgClass: string
  /** CSS variable holding the color, for canvas/WebGL drawing (MapLibre). */
  cssVar: `--risk-${string}`
}

export const RISK_META: RiskRecord<RiskMeta> = {
  low: {
    label: 'Low',
    textClass: 'text-risk-low',
    bgClass: 'bg-risk-low',
    softBgClass: 'bg-risk-low/15',
    cssVar: '--risk-low',
  },
  moderate: {
    label: 'Moderate',
    textClass: 'text-risk-moderate',
    bgClass: 'bg-risk-moderate',
    softBgClass: 'bg-risk-moderate/15',
    cssVar: '--risk-moderate',
  },
  high: {
    label: 'High',
    textClass: 'text-risk-high',
    bgClass: 'bg-risk-high',
    softBgClass: 'bg-risk-high/15',
    cssVar: '--risk-high',
  },
  severe: {
    label: 'Severe',
    textClass: 'text-risk-severe',
    bgClass: 'bg-risk-severe',
    softBgClass: 'bg-risk-severe/15',
    cssVar: '--risk-severe',
  },
  no_travel: {
    label: 'No Travel',
    textClass: 'text-risk-no-travel',
    bgClass: 'bg-risk-no-travel',
    softBgClass: 'bg-risk-no-travel/15',
    cssVar: '--risk-no-travel',
  },
}

export const CONDITION_LABELS: Readonly<Record<WeatherCondition, string>> = {
  wind: 'Wind',
  rain: 'Rain',
  snow: 'Snow',
}

export const CONDITION_UNITS: Readonly<Record<WeatherCondition, string>> = {
  wind: 'mph',
  rain: 'in/hr',
  snow: 'in/hr',
}

export function riskIndex(level: RiskLevel): RiskIndex {
  return RISK_LEVELS.indexOf(level) as RiskIndex
}

export function riskFromIndex(index: number): RiskLevel {
  const clamped = Math.min(Math.max(Math.round(index), 0), RISK_LEVELS.length - 1)
  return RISK_LEVELS[clamped] ?? 'low'
}

/** The more dangerous of the given levels (`low` for an empty list). */
export function maxRisk(levels: Iterable<RiskLevel>): RiskLevel {
  let worst: RiskIndex = 0
  for (const level of levels) worst = Math.max(worst, riskIndex(level)) as RiskIndex
  return riskFromIndex(worst)
}

/** Levels at or above `level`, e.g. `atLeast('high')` → high, severe, no_travel. */
export function atLeast(level: RiskLevel): readonly RiskLevel[] {
  return RISK_LEVELS.slice(riskIndex(level))
}
