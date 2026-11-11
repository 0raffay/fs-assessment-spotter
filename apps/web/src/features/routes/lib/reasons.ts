import { formatDuration, formatDurationDelta, formatNumber } from '@/lib/format'
import { RISK_META } from '@/lib/risk'
import { assertNever, type ReasonFact } from '@/types'

function joinOthers(values: readonly string[]): string {
  if (values.length <= 1) return values.join('')
  return `${values.slice(0, -1).join(', ')} and ${values.at(-1)}`
}

/** Turns a reason fact into a short chip label, e.g. "0 severe mi, others 50 and 75". */
export function formatReason(reason: ReasonFact): string {
  switch (reason.kind) {
    case 'fewest_miles':
      return `${formatNumber(reason.miles)} ${RISK_META[reason.level].label.toLowerCase()} mi, others ${joinOthers(reason.othersMiles.map(formatNumber))}`
    case 'lowest_average_risk':
      return `Avg risk ${reason.value.toFixed(2)}, others ${joinOthers(reason.othersValues.map((v) => v.toFixed(2)))}`
    case 'shortest_time':
      return `Shortest drive, ${formatDuration(reason.minutes)}`
    case 'time_vs_fastest':
      return `${formatDurationDelta(reason.deltaMinutes)} vs fastest`
    default:
      return assertNever(reason)
  }
}
