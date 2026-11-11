import { CircleHelpIcon } from 'lucide-react'

import { IconButton } from '@/components/icon-button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { RISK_META } from '@/lib/risk'
import { RISK_LEVELS } from '@/types'

const THRESHOLDS = [
  ['Wind', '< 25 mph', '25–34', '35–44', '45–54', '≥ 55'],
  ['Rain', '< 0.10 in/hr', '0.10–0.25', '0.25–0.50', '0.50–1.00', '> 1.00'],
  ['Snow', '< 0.5 in/hr', '0.5–1.0', '1.0–2.0', '2.0–3.0', '> 3.0'],
] as const

/** Explains how risk and the recommendation are worked out (the PDF's rules). */
export function HelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <IconButton
          label="How risk is calculated"
          icon={<CircleHelpIcon className="size-[18px]" strokeWidth={1.75} />}
        />
      </DialogTrigger>
      <DialogContent className="border-hairline-strong bg-surface-1 rounded-2xl p-6 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium tracking-[-0.4px]">
            How SkyRig rates a route
          </DialogTitle>
          <DialogDescription className="text-ink-subtle text-sm leading-relaxed">
            Weather is checked at each checkpoint for the hour the truck gets there. The worst of
            wind, rain and snow sets the checkpoint’s level.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-surface-2 overflow-x-auto rounded-xl p-3">
          <table className="w-full text-[13px] tabular-nums">
            <thead>
              <tr className="text-ink-subtle text-left">
                <th className="py-1.5 pr-3 font-normal">Condition</th>
                {RISK_LEVELS.map((level) => (
                  <th
                    key={level}
                    className={`py-1.5 pr-3 font-medium ${RISK_META[level].textClass}`}
                  >
                    {RISK_META[level].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {THRESHOLDS.map(([name, ...cells]) => (
                <tr key={name} className="border-hairline border-t">
                  <td className="text-ink-muted py-1.5 pr-3">{name}</td>
                  {cells.map((cell, i) => (
                    <td key={i} className="py-1.5 pr-3">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 text-sm leading-relaxed sm:grid-cols-2">
          <section>
            <h3 className="mb-1.5 font-medium">Load rules</h3>
            <ul className="text-ink-muted space-y-1">
              <li>≥ 55 mph is No Travel for any load</li>
              <li>45–54 mph with more than 30,000 lb is No Travel</li>
              <li>35–44 mph with more than 40,000 lb is Severe</li>
            </ul>
          </section>
          <section>
            <h3 className="mb-1.5 font-medium">Recommendation order</h3>
            <ol className="text-ink-muted list-decimal space-y-1 pl-4">
              <li>Fewest No Travel and Severe miles</li>
              <li>Fewest High miles</li>
              <li>Lowest average risk</li>
              <li>Shortest drive time</li>
            </ol>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
