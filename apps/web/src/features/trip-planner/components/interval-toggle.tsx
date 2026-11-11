import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { CHECKPOINT_INTERVALS, checkpointIntervalSchema, type CheckpointInterval } from '@/types'

interface IntervalToggleProps {
  value: CheckpointInterval
  onChange: (value: CheckpointInterval) => void
  labelledBy: string
}

/** Checkpoint spacing: 10 / 25 / 50 miles (segmented control). */
export function IntervalToggle({ value, onChange, labelledBy }: IntervalToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={String(value)}
      onValueChange={(next) => {
        const parsed = checkpointIntervalSchema.safeParse(Number(next))
        if (parsed.success) onChange(parsed.data)
      }}
      aria-labelledby={labelledBy}
      className="bg-surface-2 grid w-full grid-cols-3 gap-0.5 rounded-lg p-[3px]"
    >
      {CHECKPOINT_INTERVALS.map((miles) => (
        <ToggleGroupItem
          key={miles}
          value={String(miles)}
          className="text-ink-subtle hover:bg-surface-3 hover:text-ink data-[state=on]:bg-surface-4 data-[state=on]:text-ink h-9 rounded-[11px] text-[13px] font-medium transition-[background-color,color,box-shadow,transform] active:scale-[0.97] data-[state=on]:shadow-[0_2px_8px_rgb(0_0_0/0.35)]"
        >
          {miles} mi
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
