import type { Transition, Variants } from 'motion/react'

/** Motion tokens from DESIGN.md › Motion. */
export const EASE_OUT = [0.2, 0.8, 0.2, 1] as const
export const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const

export const DURATION = {
  press: 0.12,
  hover: 0.16,
  toggle: 0.22,
  panel: 0.36,
  routeDraw: 1.4,
} as const

export const panelTransition: Transition = { duration: DURATION.panel, ease: EASE_OUT }

export type PanelEntrance = 'left' | 'right' | 'up' | 'fade'

const OFFSETS: Record<PanelEntrance, { x?: number; y?: number; scale?: number }> = {
  left: { x: -14 },
  right: { x: 14 },
  up: { y: 24 },
  fade: { y: 8, scale: 0.985 },
}

/** Enter/exit variants for floating surfaces. */
export function panelVariants(from: PanelEntrance): Variants {
  return {
    hidden: { opacity: 0, ...OFFSETS[from] },
    visible: { opacity: 1, x: 0, y: 0, scale: 1, transition: panelTransition },
    exit: {
      opacity: 0,
      ...OFFSETS[from],
      transition: { duration: DURATION.hover, ease: EASE_IN_OUT },
    },
  }
}
