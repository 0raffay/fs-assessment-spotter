import { XIcon } from 'lucide-react'

import { IconButton } from '@/components/icon-button'
import { RiskBadge } from '@/components/risk-badge'
import { RISK_LEVELS } from '@/types'

import { useMapTools } from '../context/map-tools-store'

const MEANING = {
  low: 'Normal driving',
  moderate: 'Drive with care',
  high: 'Slow down, plan stops',
  severe: 'Avoid if possible',
  no_travel: 'Do not travel',
} as const satisfies Record<(typeof RISK_LEVELS)[number], string>

/** The risk color key, plus what the map's marks mean. */
export function LegendPanel() {
  const { closePanel } = useMapTools()

  return (
    <div className="flex flex-col gap-4 p-[18px]">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium tracking-[-0.2px]">Legend</h2>
        <IconButton
          label="Close legend"
          onClick={closePanel}
          icon={<XIcon className="size-4" />}
          className="text-ink-subtle size-[34px] rounded-xl"
        />
      </div>
      <ul className="flex flex-col gap-2.5">
        {RISK_LEVELS.map((level) => (
          <li key={level} className="flex items-center justify-between gap-3">
            <RiskBadge level={level} />
            <span className="text-ink-subtle text-[13px]">{MEANING[level]}</span>
          </li>
        ))}
      </ul>
      <ul className="border-hairline text-ink-muted flex flex-col gap-2.5 border-t pt-3.5 text-[13px]">
        <li className="flex items-center gap-3">
          <span className="bg-route-selected h-1.5 w-7 rounded-full" /> Selected route
        </li>
        <li className="flex items-center gap-3">
          <span className="bg-route-alternate h-1 w-7 rounded-full" /> Other routes
        </li>
        <li className="flex items-center gap-3">
          <span className="bg-risk-high size-[11px] rounded-full shadow-[0_0_0_2px_var(--canvas)]" />
          <span className="ml-4">Checkpoint, colored by risk at its ETA</span>
        </li>
        <li className="flex items-center gap-3">
          <span className="bg-risk-severe/40 size-4 rounded-[4px]" />
          <span className="ml-3">Heatmap cell at the selected hour</span>
        </li>
      </ul>
    </div>
  )
}
