import { CheckIcon } from 'lucide-react'

import { RiskDot } from '@/components/risk-badge'
import { formatDuration, formatMiles, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ReasonFact, Route } from '@/types'

import { formatReason } from '../lib/reasons'

import { RiskStrip } from './risk-strip'

interface RouteCardProps {
  route: Route
  selected: boolean
  onSelect: () => void
  /** Reasons are shown on the recommended card only. */
  reasons?: readonly ReasonFact[]
  compact?: boolean
}

const STAT_LEVELS = ['severe', 'high', 'moderate'] as const

/** One route option (DESIGN.md › route-card). Whole card is a toggle button. */
export function RouteCard({ route, selected, onSelect, reasons, compact = false }: RouteCardProps) {
  const unavailable = route.checkpoints.filter((c) => c.forecast.status === 'unavailable').length

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        'group/card flex w-full flex-col items-stretch gap-3 rounded-xl border text-left transition-[background-color,border-color,transform,box-shadow] duration-200 outline-none',
        'hover:border-hairline-tertiary focus-visible:ring-ring/45 hover:-translate-y-px focus-visible:ring-3 active:scale-[0.99]',
        selected
          ? 'bg-surface-2 border-primary/55'
          : 'bg-surface-1 border-hairline hover:bg-[#13151a]',
        compact ? 'p-3.5' : 'p-4',
      )}
    >
      <span className="flex items-start gap-3">
        <span
          className={cn(
            'flex size-[26px] shrink-0 items-center justify-center rounded-[9px] text-[13px] font-medium transition-colors',
            selected ? 'bg-primary text-primary-foreground' : 'bg-surface-3 text-ink-muted',
          )}
        >
          {route.rank}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[15px] font-medium tracking-[-0.2px]">{route.name}</span>
          <span className="text-ink-subtle truncate text-[13px]">{route.via}</span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-0.5 tabular-nums">
          <span className="text-[17px] font-light tracking-[-0.4px]">
            {formatDuration(route.durationMinutes)}
          </span>
          <span className="text-ink-subtle text-[13px]">{formatMiles(route.distanceMiles)}</span>
        </span>
      </span>

      <RiskStrip riskMiles={route.riskMiles} />

      <span className="flex items-center justify-between gap-2">
        <span
          className="text-ink-muted flex items-center gap-3 text-[13px] tabular-nums"
          aria-label="Miles by risk level"
        >
          {STAT_LEVELS.map((level) => (
            <span key={level} className="flex items-center gap-1.5">
              <RiskDot level={level} />
              {formatNumber(
                route.riskMiles[level] + (level === 'severe' ? route.riskMiles.no_travel : 0),
              )}
            </span>
          ))}
          <span className="text-ink-tertiary">mi</span>
        </span>
        <span className="flex shrink-0 gap-1.5">
          {route.isRecommended ? (
            <span className="bg-primary/14 inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] text-xs font-medium text-[#7dd3fc]">
              <CheckIcon className="size-3" strokeWidth={2.5} />
              Recommended
            </span>
          ) : null}
          {route.isFastest && !route.isRecommended ? (
            <span className="bg-surface-3 text-ink-muted rounded-full px-2.5 py-[3px] text-xs font-medium">
              Fastest
            </span>
          ) : null}
          {route.isGenerated ? (
            <span className="bg-surface-3 text-ink-muted rounded-full px-2.5 py-[3px] text-xs font-medium">
              Generated
            </span>
          ) : null}
        </span>
      </span>

      {route.riskMiles.no_travel > 0 ? (
        <span className="text-risk-no-travel text-[13px]">
          {formatNumber(route.riskMiles.no_travel)} mi rated No Travel
        </span>
      ) : null}

      {reasons && reasons.length > 0 ? (
        <span
          className="border-hairline flex flex-wrap gap-1.5 border-t pt-2.5 text-xs"
          aria-label="Why this route"
        >
          {reasons.map((reason, i) => (
            <span
              key={i}
              className="bg-surface-3 text-ink-muted rounded-[10px] px-2.5 py-1 tabular-nums"
            >
              {formatReason(reason)}
            </span>
          ))}
        </span>
      ) : null}

      {unavailable > 0 ? (
        <span className="text-ink-subtle text-xs">
          {unavailable} checkpoint{unavailable === 1 ? '' : 's'} beyond the forecast range
        </span>
      ) : null}
    </button>
  )
}
