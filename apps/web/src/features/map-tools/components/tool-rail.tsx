import { motion } from 'motion/react'
import { Fragment } from 'react'

import { IconButton } from '@/components/icon-button'
import { panelVariants } from '@/lib/motion'
import { cn } from '@/lib/utils'

import type { ToolDefinition } from '../types'

interface ToolRailProps<TId extends string> {
  tools: readonly ToolDefinition<TId>[]
  /** 44px touch targets on handheld, 40px on desktop. */
  large?: boolean
  className?: string
}

/** A vertical floating toolbar, rendered from typed tool definitions. */
export function ToolRail<TId extends string>({
  tools,
  large = false,
  className,
}: ToolRailProps<TId>) {
  return (
    <motion.div
      role="toolbar"
      aria-orientation="vertical"
      aria-label="Map tools"
      variants={panelVariants('right')}
      initial="hidden"
      animate="visible"
      className={cn(
        'border-hairline-strong bg-surface-1 flex flex-col gap-0.5 rounded-[20px] border p-[5px] shadow-[0_18px_44px_rgb(0_0_0/0.5)]',
        className,
      )}
    >
      {tools.map((tool) => (
        <Fragment key={tool.id}>
          {tool.separated ? (
            <span aria-hidden className="bg-hairline-strong mx-2 my-1 h-px" />
          ) : null}
          <IconButton
            label={tool.label}
            icon={tool.icon}
            pressed={tool.pressed}
            disabled={tool.disabled}
            onClick={tool.onSelect}
            tooltipSide="left"
            className={cn('rounded-[14px]', large ? 'size-11' : 'size-10')}
          />
        </Fragment>
      ))}
    </motion.div>
  )
}
