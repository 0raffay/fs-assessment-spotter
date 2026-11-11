import { AnimatePresence } from 'motion/react'
import type { CSSProperties } from 'react'

import { FloatingPanel } from '@/components/floating-panel'

import { RiskProfile } from './risk-profile'

/** Height (px) the open profile takes in the bottom dock, used for map padding and stacking. */
export const RISK_PROFILE_HEIGHT = 168

/** The risk profile floating in the bottom dock (desktop), above the forecast. */
export function RiskProfileDock({
  open,
  onClose,
  style,
}: {
  open: boolean
  onClose: () => void
  style: CSSProperties
}) {
  return (
    <AnimatePresence>
      {open ? (
        <FloatingPanel
          key="risk-profile"
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
