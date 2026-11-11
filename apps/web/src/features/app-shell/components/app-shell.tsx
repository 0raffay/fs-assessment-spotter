import { useIsDesktop } from '@/hooks/use-media-query'

import type { AppShellProps } from '../types'

import { AppHeader } from './app-header'

/**
 * Header + rounded map frame on one canvas (DESIGN.md › Layout). The frame is `relative`, so the
 * map fills it and panels float inside it with `absolute` positioning.
 */
export function AppShell({ headerStart, status, canShare, children }: AppShellProps) {
  const isDesktop = useIsDesktop()

  return (
    <div className="bg-background text-foreground flex h-dvh flex-col overflow-hidden">
      <AppHeader start={headerStart} status={status} canShare={canShare} compact={!isDesktop} />
      <main
        aria-label="Trip map"
        className="bg-map relative mx-2 mb-2 flex-1 overflow-hidden rounded-[24px] shadow-[inset_0_0_0_1px_var(--hairline)] lg:mx-3.5 lg:mb-3 lg:rounded-[28px]"
      >
        {children}
      </main>
    </div>
  )
}
