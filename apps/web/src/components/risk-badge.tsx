import { BanIcon } from 'lucide-react'

import { RISK_META } from '@/lib/risk'
import { cn } from '@/lib/utils'
import type { RiskLevel } from '@/types'

/** Dot + label in the risk color. "No Travel" adds a ban icon (risk is never color-only). */
export function RiskBadge({
  level,
  suffix,
  className,
}: {
  level: RiskLevel
  suffix?: string
  className?: string
}) {
  const meta = RISK_META[level]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-medium',
        meta.softBgClass,
        meta.textClass,
        className,
      )}
    >
      {level === 'no_travel' ? (
        <BanIcon className="size-3.5" strokeWidth={2} />
      ) : (
        <span aria-hidden className={cn('size-[7px] rounded-full', meta.bgClass)} />
      )}
      {meta.label}
      {suffix ? ` ${suffix}` : null}
    </span>
  )
}

/** Small colored dot for lists and legends. */
export function RiskDot({ level, className }: { level: RiskLevel; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block size-[7px] shrink-0 rounded-full',
        RISK_META[level].bgClass,
        className,
      )}
    />
  )
}
