import { AnimatePresence } from 'motion/react'
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { FloatingPanel } from '@/components/floating-panel'
import { IconButton } from '@/components/icon-button'
import { useIsDesktop, useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

import { useTripPlanner } from '../context/trip-planner-store'
import { SHEET_HEIGHT } from '../lib/layout'
import { SHEET_SNAPS } from '../types'

interface PlannerSurfaceProps {
  title: string
  children: ReactNode
  /** Desktop only: shown in the slim rail under the expand button while the planner is collapsed. */
  collapsed?: ReactNode
}

/**
 * Where the planner lives: a floating left panel on desktop, a floating bottom sheet on tablets and
 * phones (DESIGN.md › Layout). Content is the same; only the container changes.
 */
export function PlannerSurface({ title, children, collapsed }: PlannerSurfaceProps) {
  const isDesktop = useIsDesktop()
  const isTablet = useMediaQuery('(min-width: 768px)') && !isDesktop
  const { isPanelOpen, setPanelOpen, sheetSnap, setSheetSnap } = useTripPlanner()

  if (isDesktop) {
    return (
      <AnimatePresence mode="popLayout">
        {isPanelOpen ? (
          <FloatingPanel
            key="planner"
            from="left"
            aria-label="Trip planner"
            className="absolute top-4 left-4 z-20 flex max-h-[calc(100%-2rem)] w-[360px] flex-col"
          >
            <div className="flex items-center justify-between px-4 pt-[18px] pb-3">
              <h1 className="text-lg font-medium tracking-[-0.4px]">{title}</h1>
              <IconButton
                label="Collapse planner"
                tooltipSide="right"
                onClick={() => setPanelOpen(false)}
                icon={<PanelLeftCloseIcon className="size-4" strokeWidth={1.75} />}
                className="text-ink-subtle size-[34px] rounded-xl"
              />
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-4 pb-4">
              {children}
            </div>
          </FloatingPanel>
        ) : (
          <FloatingPanel
            key="planner-rail"
            from="left"
            aria-label="Trip planner (collapsed)"
            className="absolute top-4 left-4 z-20 flex w-[56px] flex-col items-center gap-2 p-1.5"
          >
            <IconButton
              label="Expand planner"
              tooltipSide="right"
              onClick={() => setPanelOpen(true)}
              icon={<PanelLeftOpenIcon className="size-4" strokeWidth={1.75} />}
              className="text-ink-subtle size-11 rounded-[14px]"
            />
            {collapsed ? (
              <>
                <span aria-hidden className="bg-hairline-strong h-px w-7" />
                {collapsed}
              </>
            ) : null}
          </FloatingPanel>
        )}
      </AnimatePresence>
    )
  }

  const nextSnap = SHEET_SNAPS[(SHEET_SNAPS.indexOf(sheetSnap) + 1) % SHEET_SNAPS.length] ?? 'half'

  return (
    <FloatingPanel
      from="up"
      aria-label="Trip planner"
      style={isTablet ? undefined : { height: SHEET_HEIGHT[sheetSnap] }}
      className={cn(
        'absolute bottom-2 z-20 flex flex-col rounded-[20px] transition-[height] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
        isTablet ? 'left-3 h-[calc(100%-24px)] w-[380px]' : 'inset-x-2',
      )}
    >
      {isTablet ? null : (
        <button
          type="button"
          onClick={() => setSheetSnap(nextSnap)}
          aria-label={`Resize planner (now ${sheetSnap})`}
          className="flex h-6 w-full shrink-0 cursor-grab items-center justify-center"
        >
          <span className="bg-hairline-tertiary h-[5px] w-10 rounded-full" />
        </button>
      )}
      <h1 className="sr-only">{title}</h1>
      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4',
          isTablet && 'pt-4',
        )}
      >
        {children}
      </div>
    </FloatingPanel>
  )
}
