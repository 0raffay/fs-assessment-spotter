import { AnimatePresence } from 'motion/react'
import type { CSSProperties, Ref } from 'react'

import { FloatingPanel } from '@/components/floating-panel'

import { RiskProfile } from './risk-profile'

/** The risk profile floating in the bottom dock (desktop), above the forecast. */
export function RiskProfileDock({
  open,
  onClose,
  style,
  ref,
}: {
  open: boolean
  onClose: () => void
  style: CSSProperties
  /** Receives the panel element, e.g. to measure the height it takes over the map. */
  ref?: Ref<HTMLElement>
}) {
  return (
    <AnimatePresence>
      {open ? (
        <FloatingPanel
          key="risk-profile"
          ref={ref}
          from="up"
          aria-label="Risk profile"
          className="absolute z-20"
          style={style}
        >
          <RiskProfile onClose={onClose} />
        </FloatingPanel>
      ) : null}
    </AnimatePresence>
  )
}
