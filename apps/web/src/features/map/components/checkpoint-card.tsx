import { ChevronLeftIcon, ChevronRightIcon, MapPinIcon, XIcon } from 'lucide-react'

import { IconButton } from '@/components/icon-button'
import { RiskBadge } from '@/components/risk-badge'
import {
  formatClock,
  formatDayClock,
  formatNumber,
  formatWeatherNumber,
  formatWeekday,
  formatZone,
} from '@/lib/format'
import { CONDITION_LABELS, CONDITION_UNITS, RISK_META, riskIndex } from '@/lib/risk'
import { cn } from '@/lib/utils'
import {
  RISK_LEVELS,
  WEATHER_CONDITIONS,
  type AvailableForecast,
  type Checkpoint,
  type WeatherCondition,
} from '@/types'

interface CheckpointCardProps {
  checkpoint: Checkpoint
  total: number
  routeMiles: number
  loadWeightLb: number
  onPrevious: () => void
  onNext: () => void
  onClose: () => void
}

/** Weather and risk at one checkpoint, for the truck's ETA there (DESIGN.md › Checkpoint card). */
export function CheckpointCard({
  checkpoint,
  total,
  routeMiles,
  loadWeightLb,
  onPrevious,
  onNext,
  onClose,
}: CheckpointCardProps) {
  const { forecast, eta, timeZone } = checkpoint

  return (
    <article
      aria-label={`Checkpoint ${checkpoint.index + 1} details`}
      className="flex flex-col gap-4 p-4"
    >
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {forecast.status === 'available' ? (
            <RiskBadge level={forecast.level} suffix="risk" />
          ) : (
            <span className="bg-surface-3 text-ink-muted rounded-full px-2.5 py-1 text-[13px]">
              No forecast
            </span>
          )}
          <span className="text-ink-subtle text-[13px] whitespace-nowrap tabular-nums">
            {checkpoint.index + 1} of {total}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <IconButton
            label="Previous checkpoint"
            onClick={onPrevious}
            disabled={checkpoint.index === 0}
            icon={<ChevronLeftIcon className="size-3.5" />}
            className="size-[30px] rounded-[10px]"
          />
          <IconButton
            label="Next checkpoint"
            onClick={onNext}
            disabled={checkpoint.index === total - 1}
            icon={<ChevronRightIcon className="size-3.5" />}
            className="size-[30px] rounded-[10px]"
          />
          <IconButton
            label="Close checkpoint"
            onClick={onClose}
            icon={<XIcon className="size-3.5" />}
            className="text-ink-subtle size-[30px] rounded-[10px]"
          />
        </div>
      </header>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline gap-2.5">
          <span className="text-[34px] leading-none font-light tracking-[-1.2px] tabular-nums">
            {formatClock(eta, timeZone)}
          </span>
          <span className="text-ink-subtle text-sm">
            {formatWeekday(eta, timeZone)} · {formatZone(eta, timeZone)}
          </span>
        </div>
        <span className="text-ink-muted flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
          <MapPinIcon className="text-ink-subtle size-3.5" strokeWidth={1.75} />
          <span className="whitespace-nowrap tabular-nums">
            Mile {formatNumber(checkpoint.mile)}{' '}
            <span className="text-ink-subtle">of {formatNumber(routeMiles)}</span>
          </span>
          <span>· {checkpoint.locationLabel}</span>
        </span>
      </div>

      {forecast.status === 'available' ? (
        <AvailableDetails forecast={forecast} loadWeightLb={loadWeightLb} timeZone={timeZone} />
      ) : (
        <p className="text-ink-muted bg-surface-2 rounded-xl p-3 text-sm leading-relaxed">
          The truck reaches this point after the forecast range ends, so its risk isn’t counted yet.
        </p>
      )}
    </article>
  )
}

function AvailableDetails({
  forecast,
  loadWeightLb,
  timeZone,
}: {
  forecast: AvailableForecast
  loadWeightLb: number
  timeZone: string
}) {
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {WEATHER_CONDITIONS.map((condition) => (
          <MetricTile key={condition} condition={condition} forecast={forecast} />
        ))}
      </div>
      <footer className="border-hairline text-ink-subtle flex flex-col gap-1.5 border-t pt-3 text-[13px]">
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className={cn('size-1.5 rounded-full', RISK_META[forecast.level].bgClass)}
          />
          <span>
            <span className="text-ink">{CONDITION_LABELS[forecast.decidedBy]}</span> decides this
            checkpoint’s level
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden className="bg-hairline-tertiary size-1.5 rounded-full" />
          {formatNumber(loadWeightLb)} lb load ·{' '}
          {forecast.loadRuleApplied ? (
            <span className="text-ink">load rule raised the wind level</span>
          ) : (
            'wind rule not triggered'
          )}
        </span>
        <span className="text-ink-tertiary pl-3.5 text-xs">
          Forecast for {formatDayClock(forecast.forecastHour, timeZone)}{' '}
          {formatZone(forecast.forecastHour, timeZone)} · Open-Meteo
        </span>
      </footer>
    </>
  )
}

function MetricTile({
  condition,
  forecast,
}: {
  condition: WeatherCondition
  forecast: AvailableForecast
}) {
  const level = forecast.conditionLevels[condition]
  const decides = forecast.decidedBy === condition && level !== 'low'
  const filled = riskIndex(level)

  return (
    <div
      className="bg-surface-2 flex flex-col gap-px rounded-2xl p-3 transition-colors"
      style={decides ? { boxShadow: `inset 0 0 0 1px var(${RISK_META[level].cssVar})` } : undefined}
    >
      <span className="text-ink-subtle text-xs">{CONDITION_LABELS[condition]}</span>
      <span className="text-[22px] leading-tight font-light tracking-[-0.6px] tabular-nums">
        {formatWeatherNumber(condition, forecast.weather[condition])}
      </span>
      <span className="text-ink-subtle text-xs">{CONDITION_UNITS[condition]}</span>
      <span aria-hidden className="mt-1.5 grid grid-cols-5 gap-[3px]">
        {RISK_LEVELS.map((step, i) => (
          <span
            key={step}
            className={cn(
              'h-1 rounded-full',
              i <= filled ? RISK_META[step].bgClass : 'bg-surface-4',
            )}
          />
        ))}
      </span>
      <span className={cn('text-xs font-medium', RISK_META[level].textClass)}>
        {RISK_META[level].label}
      </span>
    </div>
  )
}
