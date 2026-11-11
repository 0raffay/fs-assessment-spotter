import type { ComponentProps, ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type IconButtonProps = Omit<ComponentProps<typeof Button>, 'children' | 'aria-label'> & {
  /** Accessible name, also shown as the tooltip. */
  label: string
  icon: ReactNode
  /** For toggles: shows the selected look and sets `aria-pressed`. */
  pressed?: boolean
  tooltipSide?: ComponentProps<typeof TooltipContent>['side']
}

/** A ghost icon button with a tooltip. DESIGN.md › Interaction states: "Ghost / tool button". */
export function IconButton({
  label,
  icon,
  pressed,
  tooltipSide = 'bottom',
  className,
  variant = 'ghost',
  ...props
}: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          aria-label={label}
          aria-pressed={pressed}
          className={cn(
            'text-ink-muted hover:bg-surface-3 hover:text-ink size-10 rounded-full transition-[background-color,color,transform] duration-150 active:scale-95',
            pressed && 'bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary',
            className,
          )}
          {...props}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>{label}</TooltipContent>
    </Tooltip>
  )
}
