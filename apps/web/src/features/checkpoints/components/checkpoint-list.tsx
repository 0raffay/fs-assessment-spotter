import { XIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { IconButton } from '@/components/icon-button'
import { RiskDot } from '@/components/risk-badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useRouteSelection } from '@/features/routes'
import { formatDayClock, formatNumber } from '@/lib/format'
import { CONDITION_LABELS, RISK_META } from '@/lib/risk'
import { cn } from '@/lib/utils'
import type { Checkpoint, CheckpointId } from '@/types'

import { countByFilter, filterCheckpoints } from '../lib/checkpoints'
import { CHECKPOINT_FILTERS, type CheckpointFilter } from '../types'

const FILTER_LABELS: Record<CheckpointFilter, string> = {
  all: 'All',
  moderate: 'Moderate+',
  high: 'High+',
}

interface CheckpointListProps {
  onClose: () => void
  /** Called after a row is picked (handheld layouts close the panel so the card shows). */
  onPicked?: (id: CheckpointId) => void
}

/** Every checkpoint on the selected route, filterable by risk and synced with the map. */
export function CheckpointList({ onClose, onPicked }: CheckpointListProps) {
  const { plan, selectedRoute, selectedCheckpoint, selectCheckpoint } = useRouteSelection()
  const [filter, setFilter] = useState<CheckpointFilter>('all')
  const counts = countByFilter(selectedRoute.checkpoints)
  const rows = filterCheckpoints(selectedRoute.checkpoints, filter)
  const selectedRow = useRef<HTMLButtonElement>(null)

  // Keep the selected checkpoint in view when it changes from the map or the card.
  useEffect(() => {
    selectedRow.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedCheckpoint?.id])

  return (
    <div className="flex flex-col">
      <header className="flex items-start justify-between gap-2 p-[18px] pb-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-medium tracking-[-0.2px]">Checkpoints</h2>
          <p className="text-ink-subtle text-[13px]">
            Route {selectedRoute.rank} · {counts.all} stops, every {plan.request.intervalMiles} mi
          </p>
        </div>
        <IconButton
          label="Close checkpoints"
          onClick={onClose}
          icon={<XIcon className="size-4" />}
          className="text-ink-subtle size-[34px] shrink-0 rounded-xl"
        />
      </header>

      <div className="px-[18px] pb-3">
        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={(next) => {
            const match = CHECKPOINT_FILTERS.find((f) => f === next)
            if (match) setFilter(match)
          }}
          aria-label="Show checkpoints"
          spacing={0.5}
          className="bg-surface-2 flex w-full rounded-[14px] p-[3px]"
        >
          {CHECKPOINT_FILTERS.map((option) => (
            <ToggleGroupItem
              key={option}
              value={option}
              className="text-ink-subtle hover:bg-surface-3 hover:text-ink data-[state=on]:bg-surface-4 data-[state=on]:text-ink h-[34px] min-w-0 flex-auto gap-1.5 rounded-[11px] px-2 text-[13px] font-medium transition-[background-color,color,transform] active:scale-[0.97] data-[state=on]:shadow-[0_2px_8px_rgb(0_0_0/0.18)]"
            >
              {FILTER_LABELS[option]}
              <span className="text-ink-subtle text-xs font-normal tabular-nums">
                {counts[option]}
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <ScrollArea className="border-hairline border-t [&>[data-slot=scroll-area-viewport]]:max-h-[min(440px,calc(100dvh-330px))]">
        {rows.length === 0 ? (
          <p className="text-ink-subtle px-[18px] py-8 text-center text-sm">
            No checkpoints at {FILTER_LABELS[filter].replace('+', '')} or above on this route.
          </p>
        ) : (
          <ul
            className="flex flex-col gap-0.5 p-2"
            aria-label={`Checkpoints on route ${selectedRoute.rank}`}
          >
            {rows.map((checkpoint) => {
              const selected = checkpoint.id === selectedCheckpoint?.id
              return (
                <li key={checkpoint.id}>
                  <button
                    ref={selected ? selectedRow : undefined}
                    type="button"
                    aria-current={selected ? 'true' : undefined}
                    onClick={() => {
                      selectCheckpoint(checkpoint.id)
                      onPicked?.(checkpoint.id)
                    }}
                    className={cn(
                      'grid w-full grid-cols-[52px_1fr_auto] items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-[background-color,transform] outline-none active:scale-[0.99]',
                      'hover:bg-surface-2 focus-visible:ring-ring/45 focus-visible:ring-3',
                      selected && 'bg-primary/12 hover:bg-primary/16',
                    )}
                  >
                    <span className="text-ink-subtle font-mono text-xs tabular-nums">
                      mi {formatNumber(checkpoint.mile)}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-sm tabular-nums">
                        {formatDayClock(checkpoint.eta, checkpoint.timeZone)}
                      </span>
                      <span className="text-ink-subtle truncate text-xs">
                        {checkpointDriver(checkpoint)}
                      </span>
                    </span>
                    <CheckpointLevel checkpoint={checkpoint} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </ScrollArea>
    </div>
  )
}

/** What decides the level ("Wind · load rule"), or why there's no level. */
function checkpointDriver({ forecast, locationLabel }: Checkpoint): string {
  if (forecast.status === 'unavailable') return `${locationLabel} · beyond forecast range`
  const driver = CONDITION_LABELS[forecast.decidedBy]
  return `${driver}${forecast.loadRuleApplied ? ' · load rule' : ''} · ${locationLabel}`
}

function CheckpointLevel({ checkpoint }: { checkpoint: Checkpoint }) {
  if (checkpoint.forecast.status === 'unavailable')
    return <span className="text-ink-subtle text-xs whitespace-nowrap">No forecast</span>
  const { level } = checkpoint.forecast
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[13px] whitespace-nowrap',
        RISK_META[level].textClass,
      )}
    >
      <RiskDot level={level} />
      {RISK_META[level].label}
    </span>
  )
}
