import type { ReactNode } from 'react'

import type { StatusInfo } from '../types'

import { Brand } from './brand'
import { HelpDialog } from './help-dialog'
import { ShareButton } from './share-button'
import { StatusIndicator } from './status-indicator'
import { ThemeToggle } from './theme-toggle'

interface AppHeaderProps {
  start?: ReactNode
  status?: StatusInfo
  canShare: boolean
  compact: boolean
}

/** Centered logo; trip on the left; status and actions on the right. Shares the page canvas. */
export function AppHeader({ start, status, canShare, compact }: AppHeaderProps) {
  return (
    <header className="grid h-14 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-2 lg:h-16 lg:gap-4 lg:px-3.5">
      <div className="flex min-w-0 items-center">{start}</div>
      <Brand compact={compact} />
      <div className="flex items-center justify-end gap-1.5">
        {status && !compact ? (
          <span className="mr-2 hidden xl:inline-flex">
            <StatusIndicator {...status} />
          </span>
        ) : null}
        {compact ? null : <ShareButton disabled={!canShare} />}
        {compact ? null : <HelpDialog />}
        <ThemeToggle />
      </div>
    </header>
  )
}
