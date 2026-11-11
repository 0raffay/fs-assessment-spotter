import { formatNumber } from '@/lib/format'
import { RISK_META } from '@/lib/risk'
import { cn } from '@/lib/utils'
import { RISK_LEVELS, type RiskRecord } from '@/types'

/** 6px stacked bar of miles per risk level, fixed order Low → No Travel. */
export function RiskStrip({
  riskMiles,
  className,
}: {
  riskMiles: RiskRecord<number>
  className?: string
}) {
  const total = RISK_LEVELS.reduce((sum, level) => sum + riskMiles[level], 0) || 1
  const present = RISK_LEVELS.filter((level) => riskMiles[level] > 0)
  const label = `Risk by distance: ${present.map((level) => `${formatNumber(riskMiles[level])} mi ${RISK_META[level].label}`).join(', ')}`

  return (
    <span role="img" aria-label={label} className={cn('flex h-1.5 w-full gap-0.5', className)}>
      {present.map((level) => (
        <span
          key={level}
          className={cn(
            'h-full rounded-full transition-[width] duration-500',
            RISK_META[level].bgClass,
          )}
          style={{ width: `${(riskMiles[level] / total) * 100}%` }}
        />
      ))}
    </span>
  )
}
