import { motion, type HTMLMotionProps } from 'motion/react'

import { cn } from '@/lib/utils'
import { panelVariants, type PanelEntrance } from '@/lib/motion'

type FloatingPanelProps = Omit<
  HTMLMotionProps<'section'>,
  'initial' | 'animate' | 'exit' | 'variants'
> & {
  /** Which side it slides in from. */
  from?: PanelEntrance
}

/**
 * A surface that floats over the map (DESIGN.md › Elevation: "Floating"). Wrap conditional panels in
 * `<AnimatePresence>` so they animate out as well as in.
 */
export function FloatingPanel({ from = 'fade', className, ...props }: FloatingPanelProps) {
  return (
    <motion.section
      variants={panelVariants(from)}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn(
        'border-hairline-strong bg-surface-1 text-foreground rounded-2xl border shadow-[0_18px_44px_rgb(0_0_0/0.5)]',
        className,
      )}
      {...props}
    />
  )
}
